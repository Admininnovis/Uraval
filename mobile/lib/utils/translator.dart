/// Bilingual Live Data Translator (English <-> Tamil)
/// Handles live database fields: Event Names, Event Types, Person Names,
/// Villages/Cities, Notes/Relationships, and Descriptions.
class AppTranslator {
  static final RegExp _tamilScriptRegex = RegExp(r'[\u0B80-\u0BFF]');

  // 1. Predefined Common Terminology Dictionary
  static const Map<String, String> dictionaryEnToTa = {
    // --- Events & Functions ---
    'marriage': 'திருமணம்',
    'wedding': 'திருமணம்',
    'first son marriage': 'மூத்த மகன் திருமணம்',
    'second son marriage': 'இளைய மகன் திருமணம்',
    'son marriage': 'மகன் திருமணம்',
    'daughter marriage': 'மகள் திருமணம்',
    'sister marriage': 'சகோதரி திருமணம்',
    'brother marriage': 'சகோதரர் திருமணம்',
    'ear piercing': 'காதணி விழா',
    'ear boring': 'காதணி விழா',
    'kadhu kuthu': 'காதணி விழா',
    'kadhukuthu': 'காதணி விழா',
    'housewarming': 'புதுமனை புகுவிழா',
    'house warming': 'புதுமனை புகுவிழா',
    'grahapravesam': 'கிரகப்பிரவேசம்',
    'puthu veedu': 'புதுமனை புகுவிழா',
    'baby shower': 'வளைகாப்பு',
    'seemantham': 'சீமந்தம்',
    'birthday': 'பிறந்தநாள்',
    'birthday function': 'பிறந்தநாள் விழா',
    'puberty function': 'மஞ்சள் நீராட்டு விழா',
    'puberty ceremony': 'மஞ்சள் நீராட்டு விழா',
    'manjal neerattu': 'மஞ்சள் நீராட்டு விழா',
    'manjal neerattu vizha': 'மஞ்சள் நீராட்டு விழா',
    'temple festival': 'கோவில் திருவிழா',
    'temple function': 'கோவில் திருவிழா',
    'thiruvizha': 'திருவிழா',
    'engagement': 'நிச்சயதார்த்தம்',
    'nichayathartham': 'நிச்சயதார்த்தம்',
    'ayush homam': 'ஆயுள் ஹோமம்',
    'sashtiabdhapoorthi': 'சஷ்டியப்தபூர்த்தி (60ஆம் கல்யாணம்)',
    'sadhabishekam': 'சதாபிஷேகம் (80ஆம் கல்யாணம்)',
    'kalyana seer': 'கல்யாண சீர்',
    'moi virundhu': 'மொய் விருந்து',
    'reception': 'வரவேற்பு விழா',
    'anniversary': 'ஆண்டு விழா',
    'direct entry': 'நேரடி பதிவு',
    'direct cash': 'நேரடி ரொக்கம்',
    'direct': 'நேரடி',
    'event': 'நிகழ்வு',
    'event entry': 'நிகழ்வு பதிவு',
    'moi given': 'வழங்கிய மொய்',
    'moi received': 'பெற்ற மொய்',
    'given': 'வழங்கியது',
    'received': 'பெற்றது',
    'received in event': 'நிகழ்வில் பெற்றது',
    'returned': 'திருப்பிச் செலுத்தியது',
    'completed': 'முடிந்தது',
    'pending': 'நிலுவையில்',
    'active': 'செயலில்',
    'other': 'மற்றவை',
    'custom': 'தனிப்பயன்',
    'all': 'அனைத்தும்',

    // --- Common Notes & Relationships ---
    'friend': 'நண்பர்',
    'friends': 'நண்பர்கள்',
    'school friend': 'பள்ளி நண்பர்',
    'college friend': 'கல்லூரி நண்பர்',
    'office friend': 'அலுவலக நண்பர்',
    'work friend': 'பணி நண்பர்',
    'childhood friend': 'சிறுவயது நண்பர்',
    'best friend': 'உற்ற நண்பர்',
    'close friend': 'நெருங்கிய நண்பர்',
    'relative': 'உறவினர்',
    'relatives': 'உறவினர்கள்',
    'relation': 'உறவினர்',
    'uncle': 'மாமா',
    'mama': 'மாமா',
    'mami': 'மாமி',
    'athai': 'அத்தை',
    'aunt': 'அத்தை',
    'chithappa': 'சித்தப்பா',
    'chithi': 'சித்தி',
    'periyappa': 'பெரியப்பா',
    'periyamma': 'பெரியம்மா',
    'brother': 'சகோதரர்',
    'anna': 'அண்ணன்',
    'thambi': 'தம்பி',
    'sister': 'சகோதரி',
    'akka': 'அக்கா',
    'thangai': 'தங்கை',
    'machan': 'மச்சான்',
    'macha': 'மச்சான்',
    'maapillai': 'மாப்பிள்ளை',
    'son': 'மகன்',
    'daughter': 'மகள்',
    'father': 'தந்தை',
    'mother': 'தாய்',
    'grandfather': 'தாத்தா',
    'grandmother': 'பாட்டி',
    'neighbor': 'பக்கத்து வீட்டுக்காரர்',
    'neighbour': 'பக்கத்து வீட்டுக்காரர்',
    'colleague': 'சக ஊழியர்',
    'boss': 'முதலாளி',
    'staff': 'பணியாளர்',
    'teacher': 'ஆசிரியர்',
    'village': 'சொந்த ஊர்',
    'native': 'பூர்வீகம்',
    'vip': 'முக்கிய பிரமுகர்',
    'family': 'குடும்பத்தினர்',
    'self': 'சுய பதிவு',

    // --- Major Tamil Nadu Cities & Districts ---
    'chennai': 'சென்னை',
    'madurai': 'மதுரை',
    'coimbatore': 'கோயம்புத்தூர்',
    'kovai': 'கோவை',
    'salem': 'சேலம்',
    'trichy': 'திருச்சி',
    'tiruchirappalli': 'திருச்சிராப்பள்ளி',
    'tirunelveli': 'திருநெல்வேலி',
    'nellai': 'நெல்லை',
    'erode': 'ஈரோடு',
    'vellore': 'வேலூர்',
    'thanjavur': 'தஞ்சாவூர்',
    'tanjore': 'தஞ்சாவூர்',
    'dindigul': 'திண்டுக்கல்',
    'karur': 'கரூர்',
    'namakkal': 'நாமக்கல்',
    'tiruppur': 'திருப்பூர்',
    'kanchipuram': 'காஞ்சிபுரம்',
    'cuddalore': 'கடலூர்',
    'villupuram': 'விழுப்புரம்',
    'pollachi': 'பொள்ளாச்சி',
    'kumbakonam': 'கும்பகோணம்',
    'theni': 'தேனி',
    'nagercoil': 'நாகர்கோவில்',
    'kanyakumari': 'கன்னியாகுமரி',
    'ramanathapuram': 'ராமநாதபுரம்',
    'sivagangai': 'சிவகங்கை',
    'sivakasi': 'சிவகாசி',
    'virudhunagar': 'விருதுநகர்',
    'pudukkottai': 'புதுக்கோட்டை',
    'thoothukudi': 'தூத்துக்குடி',
    'tuticorin': 'தூத்துக்குடி',
    'nagapattinam': 'நாகப்பட்டினம்',
    'mayiladuthurai': 'மயிலாடுதுறை',
    'thiruvarur': 'திருவாரூர்',
    'krishnagiri': 'கிருஷ்ணகிரி',
    'dharmapuri': 'தர்மபுரி',
    'ariyalur': 'அரியலூர்',
    'perambalur': 'பெரம்பலூர்',
    'nilgiris': 'நீலகிரி',
    'ooty': 'ஊட்டி',
    'tiruvannamalai': 'திருவண்ணாமலை',
    'ranipet': 'ராணிப்பேட்டை',
    'tirupathur': 'திருப்பத்தூர்',
    'chengalpattu': 'செங்கல்பட்டு',
    'kallakurichi': 'கள்ளக்குறிச்சி',
    'tenkasi': 'தென்காசி',
    'bangalore': 'பெங்களூரு',
    'bengaluru': 'பெங்களூரு',
    'pondicherry': 'புதுச்சேரி',
    'puducherry': 'புதுச்சேரி',
    'palani': 'பழனி',
    'rajapalayam': 'ராஜபாளையம்',
    'kovilpatti': 'கோவில்பட்டி',
    'aruppukkottai': 'அருப்புக்கோட்டை',
    'paramakudi': 'பரமக்குடி',
    'karaikudi': 'காரைக்குடி',
    'pattukkottai': 'பட்டுக்கோட்டை',
    'mannargudi': 'மன்னார்குடி',
    'chidambaram': 'சிதம்பரம்',
    'ambur': 'ஆம்பூர்',
    'vaniyambadi': 'வாணியம்பாடி',
    'hosur': 'ஓசூர்',
    'gobichettipalayam': 'கோபிசெட்டிபாளையம்',
    'tiruchengode': 'திருச்செங்கோடு',
    'rasipuram': 'ராசிபுரம்',
    'mettupalayam': 'மேட்டுப்பாளையம்',
    'udumalaipettai': 'உடுமலைப்பேட்டை',
    'dharapuram': 'தாராபுரம்',
    'kangeyam': 'காங்கேயம்',
    'bhavani': 'பவானி',
    'perundurai': 'பெருந்துறை',
    'sathyamangalam': 'சத்தியமங்கலம்',
    'andipatti': 'ஆண்டிபட்டி',
    'bodi': 'போடி',
    'cumbum': 'கம்பம்',
    'usilampatti': 'உசிலம்பட்டி',
    'melur': 'மேலூர்',
    'thirumangalam': 'திருமங்கலம்',
    'sholavandan': 'சோழவந்தான்',
    'vadipatti': 'வாடிப்பட்டி',
    'alanganallur': 'அலங்காநல்லூர்',
    'singampunari': 'சிங்கம்புணரி',
    'devakottai': 'தேவகோட்டை',
    'manamadurai': 'மானாமதுரை',
    'rameswaram': 'ராமேஸ்வரம்',
    'sattur': 'சாத்தூர்',
    'srivilliputhur': 'ஸ்ரீவில்லிபுத்தூர்',
    'sankarankovil': 'சங்கரன்கோவில்',
    'ambasamudram': 'அம்பாசமுத்திரம்',
    'vallioor': 'வள்ளியூர்',
    'tiruchendur': 'திருச்செந்தூர்',
    'aranthangi': 'அறந்தாங்கி',
    'manapparai': 'மணப்பாறை',
    'musiri': 'முசிறி',
    'thuraiyur': 'துறையூர்',
    'lalgudi': 'லால்குடி',
    'kulithalai': 'குளித்தலை',
    'omalur': 'ஓமலூர்',
    'mettur': 'மேட்டூர்',
    'attur': 'ஆத்தூர்',
    'gudiyatham': 'குடியாத்தம்',
    'katpadi': 'காட்பாடி',
    'arcot': 'ஆற்காடு',
    'arakkonam': 'அரக்கோணம்',
    'tiruttani': 'திருத்தணி',
    'tiruvallur': 'திருவள்ளூர்',
    'tambaram': 'தாம்பரம்',
    'avadi': 'ஆவடி',

    // --- Popular Tamil Personal Names ---
    'kumar': 'குமார்',
    'ramesh': 'ரமேஷ்',
    'suresh': 'சுரேஷ்',
    'mahesh': 'மகேஷ்',
    'ganesh': 'கணேஷ்',
    'dinesh': 'தினேஷ்',
    'rajesh': 'ராஜேஷ்',
    'jayakumar': 'ஜெயக்குமார்',
    'senthil': 'செந்தில்',
    'senthilkumar': 'செந்தில்குமார்',
    'murugan': 'முருகன்',
    'murugesan': 'முருகேசன்',
    'muthu': 'முத்து',
    'muthukumar': 'முத்துக்குமார்',
    'mani': 'மணி',
    'manikandan': 'மணிகண்டன்',
    'kannan': 'கண்ணன்',
    'balaji': 'பாலாஜி',
    'vijay': 'விஜய்',
    'vijayan': 'விஜயன்',
    'karthik': 'கார்த்திக்',
    'karthikeyan': 'கார்த்திகேயன்',
    'saravanan': 'சரவணன்',
    'vignesh': 'விக்னேஷ்',
    'prakash': 'பிரகாஷ்',
    'anbu': 'அன்பு',
    'selvam': 'செல்வம்',
    'selvaraj': 'செல்வராஜ்',
    'radha': 'ராதா',
    'lakshmi': 'லட்சுமி',
    'priya': 'பிரியா',
    'deepa': 'தீபா',
    'kavitha': 'கவிதா',
    'anitha': 'அனிதா',
    'geetha': 'கீதா',
    'divya': 'திவ்யா',
    'meena': 'மீனா',
    'shanthi': 'சாந்தி',
    'revathi': 'ரேவதி',
    'suganya': 'சுகன்யா',
    'malathi': 'மாலதி',
    'vasanthi': 'வசந்தி',
    'sundar': 'சுந்தர்',
    'sundaram': 'சுந்தரம்',
    'gopal': 'கோபால்',
    'govind': 'கோவிந்த்',
    'govindan': 'கோவிந்தன்',
    'govindaraj': 'கோவிந்தராஜ்',
    'natarajan': 'நடராஜன்',
    'alagappan': 'அழகப்பன்',
    'alagar': 'அழகர்',
    'veeramani': 'வீரமணி',
    'pandi': 'பாண்டி',
    'pandian': 'பாண்டியன்',
    'selvakumar': 'செல்வக்குமார்',
    'sivakumar': 'சிவக்குமார்',
    'siva': 'சிவா',
    'sivaraman': 'சிவராமன்',
    'raman': 'ராமன்',
    'ramasamy': 'ராமசாமி',
    'krishnan': 'கிருஷ்ணன்',
    'radhakrishnan': 'ராதாகிருஷ்ணன்',
    'rajendran': 'ராஜேந்திரன்',
    'ravichandran': 'ரவிச்சந்திரன்',
    'ravi': 'ரவி',
    'baskaran': 'பாஸ்கரன்',
    'thangavel': 'தங்கவேல்',
    'velu': 'வேலு',
    'velmurugan': 'வேல்முருகன்',
    'palanisamy': 'பழனிசாமி',
    'subramanian': 'சுப்பிரமணியன்',
    'shankar': 'சங்கர்',
    'anand': 'ஆனந்த்',
    'anandan': 'ஆனந்தன்',
    'ashok': 'அசோக்',
    'mohan': 'மோகன்',
    'madhavan': 'மாதவன்',
    'narayanan': 'நாராயணன்',
    'venkatesh': 'வெங்கடேஷ்',
    'venkat': 'வெங்கட்',
    'arumugam': 'ஆறுமுகம்',
    'chinnasamy': 'சின்னசாமி',
    'munusamy': 'முனுசாமி',
    'karuppasamy': 'கருப்பசாமி',
    'kalaiyarasan': 'கலையரசன்',
    'ilango': 'இளங்கோ',
    'bharathi': 'பாரதி',
    'tamilarasan': 'தமிழரசன்',
    'dharani': 'தரணி',
    'iniyan': 'இனியன்',
    'maran': 'மாறன்',
    'parthiban': 'பார்த்திபன்',
    'surya': 'சூர்யா',
    'ajith': 'அஜித்',
    'kamal': 'கமல்',
    'rajini': 'ரஜினி',
  };

  // Reverse mapping for Tamil -> English
  static final Map<String, String> dictionaryTaToEn = {
    for (var entry in dictionaryEnToTa.entries)
      entry.value: entry.key
          .split(' ')
          .map((w) => w.isNotEmpty
              ? '${w[0].toUpperCase()}${w.substring(1)}'
              : '')
          .join(' ')
  };

  static const Map<String, String> _consonants = {
    'th': 'த்', 'dh': 'த்', 'sh': 'ஷ்', 'zh': 'ழ்', 'ch': 'ச்',
    'kh': 'க்', 'gh': 'க்', 'k': 'க்', 'g': 'க்', 'c': 'ச்',
    'ng': 'ங்', 'nj': 'ஞ்', 'gn': 'ஞ்', 't': 'ட்', 'd': 'ட்',
    'n': 'ன்', 'p': 'ப்', 'b': 'ப்', 'm': 'ம்', 'y': 'ய்',
    'r': 'ர்', 'l': 'ல்', 'v': 'வ்', 'w': 'வ்', 's': 'ஸ்',
    'h': 'ஹ்', 'j': 'ஜ்', 'f': 'ப்', 'z': 'ஸ்'
  };

  static const Map<String, String> _vowelSigns = {
    'aa': 'ா', 'a': '', 'ee': 'ீ', 'i': 'ி', 'oo': 'ூ',
    'u': 'ு', 'ai': 'ை', 'ae': 'ே', 'e': 'ெ', 'oa': 'ோ',
    'o': 'ொ', 'au': 'ௌ', 'ou': 'ௌ'
  };

  static const Map<String, String> _initialVowels = {
    'aa': 'ஆ', 'a': 'அ', 'ee': 'ஈ', 'i': 'இ', 'oo': 'ஊ',
    'u': 'உ', 'ai': 'ஐ', 'ae': 'ஏ', 'e': 'எ', 'oa': 'ஓ',
    'o': 'ஒ', 'au': 'ஔ', 'ou': 'ஔ'
  };

  /// Phonetic Latin-to-Tamil Transliteration Engine
  static String transliterateEnglishToTamil(String word) {
    if (word.isEmpty) return '';
    final input = word.toLowerCase().trim();
    if (dictionaryEnToTa.containsKey(input)) {
      return dictionaryEnToTa[input]!;
    }

    // Handle initial initials like "S." or "S " -> "செ." or "எஸ்."
    if (input.length == 1 && RegExp(r'[a-z]').hasMatch(input)) {
      final initialMap = {
        's': 'எஸ்.', 'k': 'கே.', 'm': 'எம்.', 'r': 'ஆர்.', 'p': 'பி.',
        'n': 'என்.', 'v': 'வி.', 'a': 'ஏ.', 'j': 'ஜே.', 't': 'டி.',
        'b': 'பி.', 'c': 'சி.', 'd': 'டி.', 'g': 'ஜி.', 'l': 'எல்.'
      };
      if (initialMap.containsKey(input)) return initialMap[input]!;
    }

    final buffer = StringBuffer();
    int i = 0;

    while (i < input.length) {
      final twoVowel = i + 2 <= input.length ? input.substring(i, i + 2) : '';
      final oneVowel = input.substring(i, i + 1);

      if (i == 0 && (_initialVowels.containsKey(twoVowel) || _initialVowels.containsKey(oneVowel))) {
        if (_initialVowels.containsKey(twoVowel)) {
          buffer.write(_initialVowels[twoVowel]);
          i += 2;
        } else {
          buffer.write(_initialVowels[oneVowel]);
          i += 1;
        }
        continue;
      }

      final twoCons = i + 2 <= input.length ? input.substring(i, i + 2) : '';
      final oneCons = input.substring(i, i + 1);
      String? matchedCons;
      int consLen = 0;

      if (_consonants.containsKey(twoCons)) {
        matchedCons = _consonants[twoCons];
        consLen = 2;
      } else if (_consonants.containsKey(oneCons)) {
        matchedCons = _consonants[oneCons];
        consLen = 1;
      }

      if (matchedCons != null) {
        i += consLen;
        final nextTwoVowel = i + 2 <= input.length ? input.substring(i, i + 2) : '';
        final nextOneVowel = i + 1 <= input.length ? input.substring(i, i + 1) : '';

        if (_vowelSigns.containsKey(nextTwoVowel)) {
          final base = matchedCons.replaceAll('்', '');
          buffer.write(base + _vowelSigns[nextTwoVowel]!);
          i += 2;
        } else if (_vowelSigns.containsKey(nextOneVowel)) {
          final base = matchedCons.replaceAll('்', '');
          buffer.write(base + _vowelSigns[nextOneVowel]!);
          i += 1;
        } else {
          buffer.write(matchedCons);
        }
      } else {
        if (_initialVowels.containsKey(twoVowel)) {
          buffer.write(_initialVowels[twoVowel]);
          i += 2;
        } else if (_initialVowels.containsKey(oneVowel)) {
          buffer.write(_initialVowels[oneVowel]);
          i += 1;
        } else {
          buffer.write(input[i]);
          i++;
        }
      }
    }

    final out = buffer.toString();
    return out.isNotEmpty ? out : word;
  }

  /// Main Translation Function for Live Data Fields (Event, Person, Village, Notes)
  static String translateLiveData(dynamic text, String language) {
    if (text == null) return '';
    final str = text.toString().trim();
    if (str.isEmpty) return '';

    final hasTamilScript = _tamilScriptRegex.hasMatch(str);

    // If English mode
    if (language == 'en') {
      if (!hasTamilScript) return str;
      if (dictionaryTaToEn.containsKey(str)) return dictionaryTaToEn[str]!;
      return str;
    }

    // If Tamil mode
    if (hasTamilScript) return str;

    final lower = str.toLowerCase();

    // Check prefixed patterns
    if (lower.startsWith('event:') || lower.startsWith('event :')) {
      final rest = str.replaceFirst(RegExp(r'^event\s*:\s*', caseSensitive: false), '').trim();
      return 'நிகழ்வு: ${translateLiveData(rest, 'ta')}';
    }
    if (lower.startsWith('returned:') || lower.startsWith('returned :')) {
      final rest = str.replaceFirst(RegExp(r'^returned\s*:\s*', caseSensitive: false), '').trim();
      return 'திருப்பிச் செலுத்தியது: ${translateLiveData(rest, 'ta')}';
    }
    if (lower.startsWith('received in event:') || lower.startsWith('received in event :')) {
      final rest = str.replaceFirst(RegExp(r'^received in event\s*:\s*', caseSensitive: false), '').trim();
      return 'நிகழ்வில் பெற்றது: ${translateLiveData(rest, 'ta')}';
    }
    if (lower == 'received in event') {
      return 'நிகழ்வில் பெற்றது';
    }

    // Direct dictionary lookup
    if (dictionaryEnToTa.containsKey(lower)) {
      return dictionaryEnToTa[lower]!;
    }

    // Multi-word phrase check (e.g. "Ramesh Kumar" or "First Son Marriage" or "Madurai South")
    final words = str.split(RegExp(r'\s+'));
    if (words.length > 1) {
      return words.map((w) {
        final wLower = w.toLowerCase().replaceAll(RegExp(r'[^a-z]'), '');
        if (dictionaryEnToTa.containsKey(wLower)) {
          return dictionaryEnToTa[wLower]!;
        }
        return transliterateEnglishToTamil(w);
      }).join(' ');
    }

    // Single-word lookup or fallback transliteration
    final cleanWord = lower.replaceAll(RegExp(r'[^a-z]'), '');
    if (dictionaryEnToTa.containsKey(cleanWord)) {
      return dictionaryEnToTa[cleanWord]!;
    }

    return transliterateEnglishToTamil(str);
  }
}
