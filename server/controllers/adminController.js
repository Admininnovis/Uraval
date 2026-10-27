import User from '../models/User.js';
import Event from '../models/Event.js';
import Purchase from '../models/Purchase.js';
import PaymentAttempt from '../models/PaymentAttempt.js';
import MaintenanceGrant from '../models/MaintenanceGrant.js';
import BookletActivation from '../models/BookletActivation.js';
import AccountAccess from '../models/AccountAccess.js';
import jwt from 'jsonwebtoken';
import {
  assignInvoiceToPurchase,
  buildInvoiceObject,
  SUPPLIER_DETAILS,
} from '../services/invoiceService.js';

/**
 * Escapes values for safe CSV export to prevent Formula Injection (CSV Injection).
 */
function sanitizeCsvValue(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // If value starts with formula triggers, prepend a single quote
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape inner quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * POST /api/admin/login
 * Authenticates admin users only.
 */
export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.deleted) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: User does not have administrator privileges' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[adminLogin] Error:', error);
    res.status(500).json({ message: 'Internal server error during admin login' });
  }
}

/**
 * GET /api/admin/overview
 * Returns dashboard summary metrics distinguishing all-time totals from selected-period metrics.
 */
export async function getAdminOverview(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const periodQuery = {};
    if (startDate || endDate) {
      periodQuery.createdAt = {};
      if (startDate) periodQuery.createdAt.$gte = new Date(startDate);
      if (endDate) periodQuery.createdAt.$lte = new Date(endDate);
    }

    // All-time metrics
    const totalUsers = await User.countDocuments({ deleted: { $ne: true } });
    const totalActivatedBooklets = await Event.countDocuments({ status: 'active', deleted: { $ne: true } });
    const totalDraftBooklets = await Event.countDocuments({ status: 'draft', deleted: { $ne: true } });

    const accountsFree = await AccountAccess.countDocuments({ status: 'free_trial' });
    const accountsPaid = await AccountAccess.countDocuments({ status: 'active_paid' });
    const accountsExpired = await AccountAccess.countDocuments({ status: 'expired' });

    // Financial summaries (Uravuu transactions only)
    const capturedPurchases = await Purchase.find({ application: 'uravuu', status: 'captured' });
    const grossCapturedPaise = capturedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const bookletPaise = capturedPurchases
      .filter((p) => p.purpose === 'booklet_creation')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const maintenancePaise = capturedPurchases
      .filter((p) => p.purpose === 'account_maintenance')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Selected period metrics
    const newRegistrationsPeriod = await User.countDocuments({
      ...periodQuery,
      deleted: { $ne: true },
    });
    const periodPurchases = await Purchase.find({
      application: 'uravuu',
      ...periodQuery,
    });

    const periodSuccessfulPurchases = periodPurchases.filter((p) => p.status === 'captured').length;
    const periodFailedPurchases = periodPurchases.filter((p) => p.status === 'failed').length;
    const periodPendingPurchases = periodPurchases.filter((p) =>
      ['created', 'pending'].includes(p.status)
    ).length;

    const periodCapturedPaise = periodPurchases
      .filter((p) => p.status === 'captured')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      allTime: {
        totalUsers,
        totalActivatedBooklets,
        totalDraftBooklets,
        accountsFree,
        accountsPaid,
        accountsExpired,
        grossCapturedRupees: grossCapturedPaise / 100,
        bookletCreationRupees: bookletPaise / 100,
        maintenanceRupees: maintenancePaise / 100,
        refundedRupees: 0,
        collectionsAfterRefundsRupees: grossCapturedPaise / 100,
        successfulPurchasesCount: capturedPurchases.length,
      },
      selectedPeriod: {
        startDate: startDate || null,
        endDate: endDate || null,
        newRegistrations: newRegistrationsPeriod,
        capturedRupees: periodCapturedPaise / 100,
        successfulCount: periodSuccessfulPurchases,
        failedCount: periodFailedPurchases,
        pendingCount: periodPendingPurchases,
      },
    });
  } catch (error) {
    console.error('[getAdminOverview] Error:', error);
    res.status(500).json({ message: 'Error fetching admin overview metrics' });
  }
}

/**
 * GET /api/admin/users
 * Returns paginated user accounts with access statuses and payment summaries.
 */
export async function getAdminUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search ? req.query.search.trim() : '';
    const statusFilter = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query = { deleted: { $ne: true } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // If filtering by access status, resolve matching user IDs first
    if (statusFilter && ['free_trial', 'active_paid', 'expired'].includes(statusFilter)) {
      const accessMatches = await AccountAccess.find({ status: statusFilter }).select('user');
      const userIds = accessMatches.map((a) => a.user);
      query._id = { $in: userIds };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -resetPasswordOtp')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Enrich with Access, Booklets Count, and Payment Totals
    const enriched = await Promise.all(
      users.map(async (u) => {
        const access = await AccountAccess.findOne({ user: u._id });
        const activatedBookletsCount = await Event.countDocuments({
          createdBy: u._id,
          status: 'active',
          deleted: { $ne: true },
        });
        const totalPayments = await Purchase.aggregate([
          { $match: { user: u._id, status: 'captured' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalSpentRupees = totalPayments[0] ? totalPayments[0].total / 100 : 0;

        return {
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone || null,
          role: u.role,
          registrationDate: u.createdAt,
          activatedBookletsCount,
          access: access
            ? {
                status: access.status,
                initialFreePeriodStart: access.initialFreePeriodStart,
                initialFreePeriodExpiry: access.initialFreePeriodExpiry,
                paidMaintenanceExpiry: access.paidMaintenanceExpiry,
                currentAccessExpiry: access.currentAccessExpiry,
              }
            : null,
          totalCapturedPaymentsRupees: totalSpentRupees,
        };
      })
    );

    res.json({
      users: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[getAdminUsers] Error:', error);
    res.status(500).json({ message: 'Error retrieving users list' });
  }
}

/**
 * GET /api/admin/users/:id
 * Detailed user information including booklets, maintenance grants, and payment history.
 */
export async function getAdminUserDetails(req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password -resetPasswordOtp');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const access = await AccountAccess.findOne({ user: user._id });
    const booklets = await Event.find({ createdBy: user._id, deleted: false })
      .select('eventName eventType eventDate status isPaid totalCollection activatedAt createdAt')
      .sort({ createdAt: -1 });

    const maintenanceGrants = await MaintenanceGrant.find({ user: user._id })
      .sort({ fulfilledAt: -1 })
      .populate('purchase', 'purchaseReference amount');

    const purchases = await Purchase.find({ user: user._id, application: 'uravuu' })
      .sort({ createdAt: -1 })
      .populate('booklet', 'eventName');

    res.json({
      user,
      access,
      booklets,
      maintenanceGrants,
      purchases,
    });
  } catch (error) {
    console.error('[getAdminUserDetails] Error:', error);
    res.status(500).json({ message: 'Error retrieving user details' });
  }
}

/**
 * GET /api/admin/booklets
 * Returns booklets with drafts separated, owner access status, search, and pagination.
 */
export async function getAdminBooklets(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search ? req.query.search.trim() : '';
    const statusFilter = req.query.status;

    const query = { deleted: { $ne: true } };
    if (statusFilter && ['active', 'draft'].includes(statusFilter)) {
      query.status = statusFilter;
    }

    if (search) {
      query.eventName = { $regex: search, $options: 'i' };
    }

    const total = await Event.countDocuments(query);
    const booklets = await Event.find(query)
      .populate('createdBy', 'name email phone')
      .populate('purchaseId', 'purchaseReference amount status razorpayPaymentId razorpayOrderId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const enriched = await Promise.all(
      booklets.map(async (b) => {
        const ownerAccess = b.createdBy ? await AccountAccess.findOne({ user: b.createdBy._id }) : null;
        return {
          id: b._id,
          name: b.eventName,
          eventName: b.eventName,
          eventType: b.eventType,
          eventDate: b.eventDate,
          location: b.location,
          status: b.status,
          isPaid: b.isPaid,
          isLegacy: b.isLegacy,
          createdAt: b.createdAt,
          activatedAt: b.activatedAt,
          totalCollection: b.totalCollection,
          ownerAccessStatus: ownerAccess ? ownerAccess.status : 'unknown',
          owner: b.createdBy
            ? {
                id: b.createdBy._id,
                name: b.createdBy.name,
                email: b.createdBy.email,
                phone: b.createdBy.phone,
                accessStatus: ownerAccess ? ownerAccess.status : 'unknown',
              }
            : null,
          purchase: b.purchaseId || null,
          purchaseStatus: b.purchaseId ? b.purchaseId.status : null,
          razorpayPaymentId: b.purchaseId ? b.purchaseId.razorpayPaymentId : null,
          razorpayOrderId: b.purchaseId ? b.purchaseId.razorpayOrderId : null,
        };
      })
    );

    res.json({
      booklets: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[getAdminBooklets] Error:', error);
    res.status(500).json({ message: 'Error retrieving booklets' });
  }
}

/**
 * GET /api/admin/payments
 * Returns Uravuu transactions, warnings, and backend-calculated totals across the full filtered dataset.
 */
export async function getAdminPayments(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search ? req.query.search.trim() : '';
    const purpose = req.query.purpose;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query = { application: 'uravuu' };

    if (purpose) query.purpose = purpose;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { purchaseReference: { $regex: search, $options: 'i' } },
        { razorpayOrderId: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } },
      ];
    }

    // Backend calculation across FULL filtered dataset
    const total = await Purchase.countDocuments(query);
    const fullDatasetTotals = await Purchase.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmountPaise: { $sum: '$amount' },
          capturedCount: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, 1, 0] } },
          capturedAmountPaise: {
            $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$amount', 0] },
          },
        },
      },
    ]);

    const datasetStats = fullDatasetTotals[0] || {
      totalAmountPaise: 0,
      capturedCount: 0,
      capturedAmountPaise: 0,
    };

    const purchases = await Purchase.find(query)
      .populate('user', 'name email phone')
      .populate('booklet', 'eventName eventType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Attach payment attempt details
    const enriched = await Promise.all(
      purchases.map(async (p) => {
        const attempts = await PaymentAttempt.find({ purchase: p._id }).sort({ createdAt: -1 });
        return {
          id: p._id,
          purchaseReference: p.purchaseReference,
          user: p.user
            ? {
                id: p.user._id,
                name: p.user.name,
                email: p.user.email,
                phone: p.user.phone,
              }
            : null,
          booklet: p.booklet ? { id: p.booklet._id, name: p.booklet.eventName } : null,
          purpose: p.purpose,
          amountPaise: p.amount,
          amountRupees: p.amount / 100,
          currency: p.currency,
          status: p.status,
          razorpayOrderId: p.razorpayOrderId,
          razorpayPaymentId: p.razorpayPaymentId,
          fulfilledAt: p.fulfilledAt,
          createdAt: p.createdAt,
          isDuplicateCaptureFlagged: p.isDuplicateCaptureFlagged,
          reconciliationNotes: p.reconciliationNotes,
          attempts,
        };
      })
    );

    res.json({
      payments: enriched,
      datasetSummary: {
        totalFilteredRecords: total,
        capturedCount: datasetStats.capturedCount,
        grossCapturedRupees: datasetStats.capturedAmountPaise / 100,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[getAdminPayments] Error:', error);
    res.status(500).json({ message: 'Error retrieving payment transactions' });
  }
}

/**
 * GET /api/admin/payments/export
 * Exports filtered payments as CSV with formula-injection sanitization.
 */
export async function exportPaymentsCsv(req, res) {
  try {
    const purpose = req.query.purpose;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query = { application: 'uravuu' };
    if (purpose) query.purpose = purpose;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const purchases = await Purchase.find(query)
      .populate('user', 'name email phone')
      .populate('booklet', 'eventName')
      .sort({ createdAt: -1 });

    const headers = [
      'Purchase Reference',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Purpose',
      'Amount (INR)',
      'Status',
      'Razorpay Order ID',
      'Razorpay Payment ID',
      'Created At (UTC)',
      'Fulfilled At (UTC)',
      'Warnings',
    ];

    const rows = purchases.map((p) => [
      sanitizeCsvValue(p.purchaseReference),
      sanitizeCsvValue(p.user?.name || 'N/A'),
      sanitizeCsvValue(p.user?.email || 'N/A'),
      sanitizeCsvValue(p.user?.phone || 'N/A'),
      sanitizeCsvValue(p.purpose),
      sanitizeCsvValue((p.amount / 100).toFixed(2)),
      sanitizeCsvValue(p.status),
      sanitizeCsvValue(p.razorpayOrderId || ''),
      sanitizeCsvValue(p.razorpayPaymentId || ''),
      sanitizeCsvValue(p.createdAt ? p.createdAt.toISOString() : ''),
      sanitizeCsvValue(p.fulfilledAt ? p.fulfilledAt.toISOString() : ''),
      sanitizeCsvValue(p.isDuplicateCaptureFlagged ? 'DUPLICATE_CAPTURE_FLAGGED' : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="uravuu-payments-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('[exportPaymentsCsv] Error:', error);
    res.status(500).json({ message: 'Error generating CSV export' });
  }
}

/**
 * GET /api/admin/invoices
 * Returns paginated, month-filtered captured invoices with financial summary.
 */
export async function getAdminInvoices(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const { month, search } = req.query; // format: "YYYY-MM"

    const query = { application: 'uravuu', status: 'captured' };

    // Filter by month
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split('-').map(Number);
      const startOfMonth = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
      query.$or = [
        { fulfilledAt: { $gte: startOfMonth, $lte: endOfMonth } },
        { invoiceDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
      ];
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [{ name: regex }, { email: regex }, { phone: regex }],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { purchaseReference: regex },
            { invoiceNumber: regex },
            { razorpayPaymentId: regex },
            { user: { $in: userIds } },
          ],
        },
      ];
    }

    const total = await Purchase.countDocuments(query);
    const purchases = await Purchase.find(query)
      .populate('user', 'name email phone')
      .populate('booklet', 'eventName')
      .sort({ fulfilledAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Ensure all items have invoice numbers assigned
    const enriched = await Promise.all(
      purchases.map(async (p) => {
        if (!p.invoiceNumber) {
          await assignInvoiceToPurchase(p._id);
          p.invoiceNumber = (await Purchase.findById(p._id)).invoiceNumber;
        }
        return {
          id: p._id,
          purchaseReference: p.purchaseReference,
          invoiceNumber: p.invoiceNumber,
          purpose: p.purpose,
          amountRupees: p.amount / 100,
          date: p.invoiceDate || p.fulfilledAt || p.createdAt,
          user: {
            id: p.user?._id,
            name: p.user?.name || 'N/A',
            email: p.user?.email || 'N/A',
            phone: p.user?.phone || 'N/A',
          },
          invoiceData: buildInvoiceObject(p, p.user),
        };
      })
    );

    // Compute month summary
    const allFiltered = await Purchase.find(query);
    let totalGrossPaise = 0;
    let totalTaxablePaise = 0;
    let totalCgstPaise = 0;
    let totalSgstPaise = 0;

    for (const p of allFiltered) {
      const isBooklet = p.purpose === 'booklet_creation';
      const snap = p.pricingSnapshot || {};
      totalGrossPaise += p.amount;
      totalTaxablePaise += snap.taxableAmountPaise || (isBooklet ? 12712 : 8475);
      totalCgstPaise += snap.cgstPaise || (isBooklet ? 1144 : 763);
      totalSgstPaise += snap.sgstPaise || (isBooklet ? 1144 : 763);
    }

    // Available distinct months for dropdown
    const dates = await Purchase.find({ application: 'uravuu', status: 'captured' }).select(
      'fulfilledAt createdAt invoiceDate'
    );
    const monthsSet = new Set();
    dates.forEach((d) => {
      const dt = d.invoiceDate || d.fulfilledAt || d.createdAt;
      if (dt) {
        const ym = new Date(dt).toISOString().substring(0, 7);
        monthsSet.add(ym);
      }
    });
    const availableMonths = Array.from(monthsSet).sort().reverse();

    res.json({
      invoices: enriched,
      summary: {
        totalInvoicesCount: total,
        totalGrossRupees: (totalGrossPaise / 100).toFixed(2),
        totalTaxableRupees: (totalTaxablePaise / 100).toFixed(2),
        totalCgstRupees: (totalCgstPaise / 100).toFixed(2),
        totalSgstRupees: (totalSgstPaise / 100).toFixed(2),
      },
      availableMonths,
      supplier: SUPPLIER_DETAILS,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('[getAdminInvoices] Error:', error);
    res.status(500).json({ message: 'Error retrieving invoices' });
  }
}

/**
 * GET /api/admin/invoices/all-by-month
 * Returns all invoices for a selected month without pagination for batch PDF generation.
 */
export async function getAdminInvoicesAllByMonth(req, res) {
  try {
    const { month } = req.query; // format: "YYYY-MM"
    const query = { application: 'uravuu', status: 'captured' };

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split('-').map(Number);
      const startOfMonth = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
      query.$or = [
        { fulfilledAt: { $gte: startOfMonth, $lte: endOfMonth } },
        { invoiceDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
      ];
    }

    const purchases = await Purchase.find(query)
      .populate('user', 'name email phone')
      .populate('booklet', 'eventName')
      .sort({ fulfilledAt: 1, createdAt: 1 });

    const invoices = await Promise.all(
      purchases.map(async (p) => {
        if (!p.invoiceNumber) {
          await assignInvoiceToPurchase(p._id);
          p.invoiceNumber = (await Purchase.findById(p._id)).invoiceNumber;
        }
        return buildInvoiceObject(p, p.user);
      })
    );

    res.json({
      month: month || 'all',
      count: invoices.length,
      supplier: SUPPLIER_DETAILS,
      invoices,
    });
  } catch (error) {
    console.error('[getAdminInvoicesAllByMonth] Error:', error);
    res.status(500).json({ message: 'Error retrieving all invoices for month' });
  }
}

