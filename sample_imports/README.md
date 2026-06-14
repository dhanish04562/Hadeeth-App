# Hadith Admin Import Files

This directory contains sample import files for bulk uploading data to the Hadith App admin console.

## Files Included

### 1. **books.json / books.csv**
Upload books (collections) to your database.

**Required Fields:**
- `id` - Unique identifier
- `title` - Book title
- `author` - Author name
- `lang_code` - Language code (e.g., 'ta' for Tamil)
- `is_published` - true/false

**Optional Fields:**
- `notes` - Additional information
- `hadeeth_count` - Total count of hadeeth
- `era` - Historical era

**Example (JSON):**
```json
{
  "id": "book_01",
  "title": "அல்ஹதீஸ் அஸ்ஸஹிஹ் அல்புகாரி",
  "author": "முஹம்மது பின் இஸ்மாயீல் அல்புகாரி",
  "lang_code": "ta",
  "is_published": true
}
```

---

### 2. **chapters.json / chapters.csv**
Upload chapters (sections within books).

**Required Fields:**
- `id` - Unique identifier
- `book_id` - Reference to parent book
- `title` - Chapter title
- `lang_code` - Language code
- `is_published` - true/false

**Optional Fields:**
- `parent_id` - For nested chapters
- `notes` - Chapter description
- `hadeeth_count` - Number of hadeeth in chapter

**Example (JSON):**
```json
{
  "id": "ch_01_01",
  "book_id": "book_01",
  "title": "அல்லாஹ்விடம் அத்தியாயத்தின் சிறப்பு",
  "lang_code": "ta",
  "is_published": true
}
```

---

### 3. **hadeeth.json / hadeeth.csv**
Upload individual hadeeth (narrations/sayings).

**Required Fields:**
- `id` - Unique identifier
- `book_id` - Reference to parent book
- `chapter_id` - Reference to parent chapter
- `reference_number` - Hadeeth number (e.g., 524)
- `reported_by` - Narrator name
- `arabic` - Arabic text of the hadeeth
- `english` - English/Tamil translation
- `lang_code` - Language code
- `is_published` - true/false

**Optional Fields:**
- `grade` - Authenticity grade (Sahih, Hasan, Da'if, or empty)
- `notes` - Commentary or notes

**Example (JSON):**
```json
{
  "id": "h_001_001_524",
  "book_id": "book_01",
  "chapter_id": "ch_01_01",
  "reference_number": 524,
  "reported_by": "அபூ ஹுரைரா",
  "arabic": "عن أبي هريرة...",
  "english": "Tamil translation...",
  "grade": "Sahih",
  "lang_code": "ta",
  "is_published": true
}
```

---

### 4. **languages.json / languages.csv**
Upload language definitions.

**Required Fields:**
- `code` - ISO 639-1 language code (e.g., 'ta', 'en', 'ar')
- `name` - English name

**Optional Fields:**
- `native_name` - Name in native script
- `direction` - Writing direction ('ltr' or 'rtl')

**Example (JSON):**
```json
{
  "code": "ta",
  "name": "Tamil",
  "native_name": "தமிழ்",
  "direction": "ltr"
}
```

---

## How to Import

1. Go to **Admin Console** (e.g., `/admin`)
2. Navigate to the section you want to import (Books, Chapters, Hadeeth, Languages)
3. Click the **Import** button (with upload icon 📤)
4. Select a `.json` or `.csv` file from this directory
5. The system will validate and import the data
6. You'll see a success message with the count of imported items

---

## Important Notes

- **Field Names:** Both snake_case (`lang_code`) and camelCase (`langCode`) are accepted
- **IDs:** If an ID already exists, the item will be **updated** instead of created
- **Validation:** Required fields must be present, or the item will be skipped
- **Order:** Import in this order for best results:
  1. Languages
  2. Books
  3. Chapters
  4. Hadeeth
- **CSV Format:** Use commas to separate fields; Tamil text is supported

---

## Troubleshooting

- **File not accepted:** Ensure it's `.json` or `.csv` format
- **Import fails silently:** Check that all required fields are present
- **Encoding issues:** Ensure files are saved as **UTF-8** for Tamil text
- **Slow imports:** Large files (>5000 items) may take a moment

