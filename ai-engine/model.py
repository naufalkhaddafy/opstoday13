import pickle
import os
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC

MODEL_PATH = "ticket_classifier.pkl"

# Indonesian Stopwords
stop_words_id = [
    'di', 'ke', 'dari', 'dan', 'atau', 'untuk', 'yang', 'dengan', 'ini', 'itu', 'pada', 'jika',
    'karena', 'bisa', 'ada', 'tidak', 'belum', 'sudah', 'akan', 'tolong', 'bantu', 'bantuan',
    'mohon', 'tanya', 'masalah', 'kendala', 'eror', 'error', 'gagal', 'cek', 'perlu', 'minta', 'buat', 'terus',
    'mau', 'muncul', 'kenapa', 'gimana', 'cara', 'apa', 'lagi', 'masih', 'udah', 'gak', 'ga', 'nggak',
    'pas', 'saat', 'waktu', 'ketika', 'setelah', 'bikin', 'kasih', 'buka', 'tutup', 'nya', 'kok', 'sih',
    'tdk', 'blm', 'sdh', 'dgn', 'all', 'tiket', 'ticket', 'unit', 'selesai', 'service', 'kpca', 'ab01',
    'tambah', 'hapus', 'kurang', 'baik', 'benar', 'salah', 'ingin', 'harus', 'coba', 'notif', 'sejak', 'kemarin'
]

# 3. Level 3: Predictive Resolution (Expert System Solutions)
# Tetap digunakan sebagai Fallback SOP berdasarkan Kategori Hasil Prediksi ML
SOLUTION_MAP = {
    'Email': 'SOP: Pandu user reset password via portal mandiri. Cek status AD (Active Directory) apakah terkunci. Verifikasi token MFA/Autentikator. Jika Outlook hang, lakukan repair profile email atau hapus file OST.',
    'Printer / Copy / Fax': 'SOP: 1. Cek koneksi kabel/jaringan printer. 2. Buka penutup dan tarik kertas yang tersangkut pelan-pelan. 3. Ganti cartridge tinta/toner jika cetakan buram. 4. Restart print spooler service di PC klien.',
    'Application / Software': 'SOP: Pastikan aplikasi sudah versi terbaru. Restart service jika berat. Cek lisensi aplikasi (misal: MS Office, Adobe).',
    'MKN-related (IT Scope)': 'SOP: Lakukan ping ke gateway dan DNS luar untuk memastikan konektivitas. Periksa fisik kabel LAN atau pastikan perangkat terkoneksi ke SSID WiFi perusahaan yang benar. Restart router/switch access bila perlu.',
    'My Computer': 'SOP: 1. Tekan tombol power 10 detik (hard reset) bila hang. 2. Cabut pasang kabel monitor/konektor jika blank. 3. Ganti unit keyboard/mouse bila mati. 4. Ajukan perbaikan vendor jika motherboard/baterai drop.',
    'File Server': 'SOP: Pastikan user memiliki hak akses / permission (RW) pada folder yang dituju. Cek kapasitas disk storage server.',
    'Login Account': 'SOP: Verifikasi akun tidak expired/locked di Active Directory. Reset password jika user lupa.',
    'Fingerprint / Kiosk': 'SOP: Restart perangkat fingerprint. Tarik log absensi secara manual dari mesin jika gagal sinkronisasi.',
    'Other': 'Pengecekan Manual Diperlukan: Topik spesifik belum teridentifikasi pasti. Silakan investigasi lebih detail atau hubungi pelapor.'
}

# 4. Expert Overrides (Aturan Paksa / Prioritas Tertinggi)
# Mengesampingkan Machine Learning jika keyword spesifik ini muncul (Berguna untuk Aplikasi Baru)
EXPERT_OVERRIDES = {
    'b-simpel': {
        'keywords': ['b simpel', 'bsimpel', 'b-simpel', 'electronic signature', 'tanda tangan elektronik', 'e-sign', 'esign', 'esignature'],
        'category': 'Application / Software',
        'sub_category': 'B-Simpel',
        'solution': 'SOP: Cek status sertifikat elektronik (e-Sign) user. Pastikan akun B-Simpel tidak terkunci, NIK sudah terdaftar, dan koneksi ke server e-Signature stabil.'
    }
}

def get_model_data():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    return None

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return text

def train_new_model(titles, categories, sub_categories):
    if not titles or len(titles) == 0:
        return None
        
    cleaned_titles = [clean_text(t) for t in titles]
    
    # 1. Feature Extraction (TF-IDF Vectorizer)
    # Menggunakan max_df dan min_df untuk membuang kata yang terlalu umum atau terlalu langka
    vectorizer = TfidfVectorizer(stop_words=stop_words_id, lowercase=True, ngram_range=(1, 2), max_df=0.9, min_df=2)
    X = vectorizer.fit_transform(cleaned_titles)
    
    # 2. Train Category Model (Supervised)
    # Menggunakan algoritma Linear Support Vector Classification
    clf_category = LinearSVC(random_state=42)
    clf_category.fit(X, categories)
    
    # 3. Train Sub Category Model (Supervised)
    clf_subcategory = LinearSVC(random_state=42)
    clf_subcategory.fit(X, sub_categories)
    
    model_data = {
        'vectorizer': vectorizer,
        'category_model': clf_category,
        'subcategory_model': clf_subcategory
    }
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model_data, f)
        
    return model_data

def predict_category(text):
    model_data = get_model_data()
    
    if not model_data or 'category_model' not in model_data:
        return {
            "cluster_id": 0, 
            "cluster_label": "Uncategorized", 
            "sub_cluster_label": None, 
            "suggested_solution": None
        }
        
    vectorizer = model_data['vectorizer']
    clf_category = model_data['category_model']
    clf_subcategory = model_data['subcategory_model']
    
    cleaned_text = clean_text(text)
    
    if not cleaned_text.strip():
        label = "Other"
        return {
            "cluster_id": abs(hash(label)) % 100000, 
            "cluster_label": label,
            "sub_cluster_label": "Unknown",
            "suggested_solution": SOLUTION_MAP['Other']
        }
        
    # 1. HARD OVERRIDES (Prioritas Utama)
    for key, override in EXPERT_OVERRIDES.items():
        if any(kw in cleaned_text for kw in override['keywords']):
            return {
                "cluster_id": abs(hash(override['category'])) % 100000,
                "cluster_label": override['category'],
                "sub_cluster_label": override['sub_category'],
                "suggested_solution": override['solution']
            }
        
    # 2. Prediksi menggunakan model Supervised ML
    X_test = vectorizer.transform([cleaned_text])
    
    pred_cat = clf_category.predict(X_test)[0]
    pred_subcat = clf_subcategory.predict(X_test)[0]
    
    # HYBRID AI: Jika prediksinya adalah "Other", "Unknown", atau sejenisnya, 
    # AI akan membongkar kalimatnya dan mengekstrak kata kunci terpenting secara otomatis!
    if str(pred_subcat).lower() in ['other', 'unknown', 'none', '']:
        feature_names = vectorizer.get_feature_names_out()
        tfidf_scores = X_test.toarray()[0]
        
        import numpy as np
        nonzero_indices = tfidf_scores.nonzero()[0]
        
        if len(nonzero_indices) > 0:
            # Urutkan berdasarkan skor TF-IDF tertinggi
            sorted_indices = nonzero_indices[np.argsort(tfidf_scores[nonzero_indices])[::-1]]
            best_word = feature_names[sorted_indices[0]]
            
            # Cari kata tersebut di teks asli untuk mempertahankan huruf besar/kecil (Capital Case) aslinya
            import re
            match = re.search(r'\b' + re.escape(best_word) + r'\b', text, re.IGNORECASE)
            if not match:
                match = re.search(re.escape(best_word), text, re.IGNORECASE)
                
            if match:
                pred_subcat = match.group(0)
            else:
                pred_subcat = best_word.title()
    
    # Ambil rekomendasi solusi dari sistem pakar (atau default ke Other)
    solution = SOLUTION_MAP.get(pred_cat, SOLUTION_MAP['Other'])
    
    cluster_id = abs(hash(pred_cat)) % 100000
    
    return {
        "cluster_id": cluster_id,
        "cluster_label": pred_cat,
        "sub_cluster_label": pred_subcat,
        "suggested_solution": solution
    }
