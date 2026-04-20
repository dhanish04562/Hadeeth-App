const languages = [
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    direction: "rtl"
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    direction: "ltr"
  }
];

const books = [
  {
    id: "book-bukhari",
    slug: "sahih-al-bukhari",
    collectionNumber: "1",
    author: "Imam al-Bukhari",
    isPublished: true,
    translations: {
      ar: {
        title: "صحيح البخاري",
        summary: "مجموعة مرتبة من الأحاديث مع أبواب واضحة وسهولة في التصفح."
      },
      ta: {
        title: "ஸஹீஹுல் புகாரி",
        summary: "தெளிவான அத்தியாய ஒழுங்குடன் ஹதீஸ்களை வாசிக்க ஏற்ற தொகுப்பு."
      }
    }
  },
  {
    id: "book-muslim",
    slug: "sahih-muslim",
    collectionNumber: "2",
    author: "Imam Muslim",
    isPublished: true,
    translations: {
      ar: {
        title: "صحيح مسلم",
        summary: "عرض هادئ ومنظم للأحاديث مع دعم تعدد اللغات."
      },
      ta: {
        title: "ஸஹீஹ் முஸ்லிம்",
        summary: "பல மொழி ஆதரவுடன் ஒழுங்காக படிக்க வடிவமைக்கப்பட்ட ஹதீஸ் தொகுப்பு."
      }
    }
  }
];

const chapters = [
  {
    id: "chapter-revelation",
    bookId: "book-bukhari",
    parentId: null,
    chapterNumber: 1,
    isPublished: true,
    translations: {
      ar: {
        title: "بدء الوحي",
        introduction: "أحاديث تتناول بداية نزول الوحي وصدق النية."
      },
      ta: {
        title: "வஹ்யின் ஆரம்பம்",
        introduction: "வஹ்ய் ஆரம்பம் மற்றும் நிய்யத்தின் முக்கியத்துவத்தை கூறும் ஹதீஸ்கள்."
      }
    }
  },
  {
    id: "chapter-faith",
    bookId: "book-bukhari",
    parentId: null,
    chapterNumber: 2,
    isPublished: true,
    translations: {
      ar: {
        title: "الإيمان",
        introduction: "باب يجمع نصوصا في تعريف الإيمان وآثاره."
      },
      ta: {
        title: "ஈமான்",
        introduction: "ஈமான் பற்றிய அடிப்படை விளக்கங்களையும் அதன் பலன்களையும் உள்ளடக்கும் அத்தியாயம்."
      }
    }
  },
  {
    id: "chapter-purity",
    bookId: "book-muslim",
    parentId: null,
    chapterNumber: 1,
    isPublished: true,
    translations: {
      ar: {
        title: "الطهارة",
        introduction: "أحاديث في الطهارة وآداب العبادة."
      },
      ta: {
        title: "தஹாரத்",
        introduction: "தூய்மை மற்றும் வழிபாட்டு ஒழுக்கங்களை விளக்கும் ஹதீஸ்கள்."
      }
    }
  }
];

const hadeeth = [
  {
    id: "hadith-intentions",
    chapterId: "chapter-revelation",
    hadithNumber: 1,
    referenceNumber: "1",
    reportedBy: "Umar ibn al-Khattab",
    grade: "Sahih",
    isPublished: true,
    translations: {
      ar: {
        text: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى.",
        notes: "هذا الحديث أصل في الإخلاص وتصحيح المقصد."
      },
      ta: {
        text: "அமல்கள் அனைத்தும் நிய்யத்தின்படியே அமையும்; ஒவ்வொருவருக்கும் அவர் நினைத்ததே உண்டு.",
        notes: "இஹ்லாஸ் மற்றும் உண்மையான நோக்கம் பற்றிய அடிப்படை ஹதீஸ்."
      }
    }
  },
  {
    id: "hadith-revelation-bell",
    chapterId: "chapter-revelation",
    hadithNumber: 2,
    referenceNumber: "2",
    reportedBy: "Aisha",
    grade: "Sahih",
    isPublished: true,
    translations: {
      ar: {
        text: "أَوَّلُ مَا بُدِئَ بِهِ رَسُولُ اللَّهِ صلى الله عليه وسلم مِنَ الْوَحْيِ الرُّؤْيَا الصَّالِحَةُ.",
        notes: "وصف لأول صور الوحي قبل نزول القرآن جملة."
      },
      ta: {
        text: "அல்லாஹ்வின் தூதருக்கு வஹ்ய் ஆரம்பமானது நல்ல கனவுகளின் மூலம் ஆகும்.",
        notes: "வஹ்ய் தொடக்க அனுபவத்தின் ஆரம்ப நிலையைச் சொல்கிறது."
      }
    }
  },
  {
    id: "hadith-faith-branches",
    chapterId: "chapter-faith",
    hadithNumber: 9,
    referenceNumber: "9",
    reportedBy: "Abu Hurairah",
    grade: "Sahih",
    isPublished: true,
    translations: {
      ar: {
        text: "الإِيمَانُ بِضْعٌ وَسَبْعُونَ شُعْبَةً، وَالْحَيَاءُ شُعْبَةٌ مِنَ الإِيمَانِ.",
        notes: "يبين أن الإيمان قول وعمل وشعب متعددة."
      },
      ta: {
        text: "ஈமான் எழுபதுக்கும் மேற்பட்ட கிளைகளைக் கொண்டது; வெட்கம் அதில் ஒரு கிளை.",
        notes: "ஈமான் என்பது நம்பிக்கையிலும் நடத்தையிலும் வெளிப்படுகிறது என்பதை விளக்குகிறது."
      }
    }
  },
  {
    id: "hadith-purity-half-faith",
    chapterId: "chapter-purity",
    hadithNumber: 223,
    referenceNumber: "223",
    reportedBy: "Abu Malik al-Ashari",
    grade: "Sahih",
    isPublished: true,
    translations: {
      ar: {
        text: "الطُّهُورُ شَطْرُ الإِيمَانِ.",
        notes: "حديث موجز وعظيم في منزلة الطهارة."
      },
      ta: {
        text: "தூய்மை என்பது ஈமானின் பாதியாகும்.",
        notes: "தூய்மையின் உயர்ந்த நிலையை மிகச் சுருக்கமாக எடுத்துரைக்கும் ஹதீஸ்."
      }
    }
  }
];

module.exports = {
  languages,
  books,
  chapters,
  hadeeth
};
