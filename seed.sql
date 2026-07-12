--
-- PostgreSQL database dump
--

\restrict sryyD4WTQ4e1rC89yIynWC66M8cXPT9pmsrE4lnICz2pQ1cBe6hILG6eCQFphS2

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: admin_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_accounts (id, username, password_hash, display_name, created_at) FROM stdin;
1       admin   $2b$10$nfkj.W0Dnv3MJ5YFUS66eONMY.tnFLlHif6XvZJytiX1o6sNwVf9q    المدير العام    2026-07-01 16:23:26.675605+00
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, name, short_name, icon, is_custom, sub_item_ids, sort_order, created_at) FROM stdin;
surgery عيادة الجراحة العامة والطوارئ   الجراحة Scissors        f       \N      1       2026-07-01 16:23:21.05701+00
lab     مختبر التحاليل الطبية   المختبر FlaskConical    f       \N      2       2026-07-01 16:23:21.05701+00
radiology       الأشعة التشخيصية        الأشعة  Aperture        f       \N      3       2026-07-01 16:23:21.05701+00
rehab   العلاج التأهيلي التأهيلي        Dumbbell        f       \N      4       2026-07-01 16:23:21.05701+00
\.


--
-- Data for Name: diagnoses_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.diagnoses_catalog (id, code, name, category, dept, created_at) FROM stdin;
3       USR1782971175367        التهاب اللوز    أخرى    surgery 2026-07-02 05:46:15.94285+00
4       K37     التهاب الزائدة الدودية الحاد — Acute Appendicitis       الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
5       K80     حصوات المرارة — Cholelithiasis  الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
6       K81.0   التهاب المرارة الحاد — Acute Cholecystitis      الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
7       K25     قرحة المعدة — Gastric Ulcer     الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
8       K26     قرحة الاثني عشر — Duodenal Ulcer        الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
9       K29.5   التهاب المعدة المزمن — Chronic Gastritis        الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
10      K21.0   ارتداد المريء — Gastroesophageal Reflux Disease (GERD)  الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
11      K57     التهاب الرتوج — Diverticulitis  الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
12      K56.6   انسداد الأمعاء الدقيقة — Small Intestinal Obstruction   الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
13      K56.7   انسداد الأمعاء الغليظة — Large Intestinal Obstruction   الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
14      K70     تليف الكبد — Liver Cirrhosis    الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
15      B16     التهاب الكبد الفيروسي ب — Hepatitis B   الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
16      B17.1   التهاب الكبد الفيروسي ج — Hepatitis C   الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
17      K85     التهاب البنكرياس الحاد — Acute Pancreatitis     الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
18      K86     التهاب البنكرياس المزمن — Chronic Pancreatitis  الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
19      K59.0   الإمساك المزمن — Chronic Constipation   الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
20      K58     متلازمة القولون العصبي — Irritable Bowel Syndrome (IBS) الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
21      K51     التهاب القولون التقرحي — Ulcerative Colitis     الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
22      K76.0   الكبد الدهني — Fatty Liver (NAFLD/NASH) الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
23      K50     مرض كرون — Crohn's Disease      الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
24      K65     التهاب الصفاق — Peritonitis     الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
25      K35     خراج الزائدة الدودية — Appendiceal Abscess      الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
26      K40     الفتق الإربي — Inguinal Hernia  الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
27      K41     الفتق الفخذي — Femoral Hernia   الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
28      K42     الفتق السري — Umbilical Hernia  الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
29      K43     الفتق البطني — Ventral/Incisional Hernia        الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
30      K44     الفتق الحجابي — Hiatus Hernia   الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
31      L05     الكيسة الشعرية — Pilonidal Cyst/Sinus   الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
32      K61     خراج الشرج — Anorectal Abscess  الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
33      K60     الشق الشرجي — Anal Fissure      الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
34      K64     البواسير — Hemorrhoids  الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
35      K62.3   ناسور الشرج — Anorectal Fistula الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
36      C18     سرطان القولون — Colon Cancer    الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
37      C20     سرطان المستقيم — Rectal Cancer  الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
38      C22     سرطان الكبد — Hepatocellular Carcinoma  الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
39      C25     سرطان البنكرياس — Pancreatic Cancer     الجراحة العامة  surgery 2026-07-02 09:20:42.488184+00
40      R10     ألم البطن الحاد — Acute Abdominal Pain  الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
41      K92.0   القيء الدموي — Hematemesis      الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
42      K92.1   البراز الأسود / نزيف هضمي — Melena / GI Bleeding        الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
43      K25.0   ثقب القرحة الهضمية — Perforated Peptic Ulcer    الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
44      J18     الالتهاب الرئوي — Pneumonia     الجهاز التنفسي  surgery 2026-07-02 09:20:42.488184+00
45      J45     الربو — Bronchial Asthma        الجهاز التنفسي  surgery 2026-07-02 09:20:42.488184+00
46      J44     الانسداد الرئوي المزمن (COPD)   الجهاز التنفسي  surgery 2026-07-02 09:20:42.488184+00
47      J22     التهاب القصبات الحاد — Acute Bronchitis الجهاز التنفسي  surgery 2026-07-02 09:20:42.488184+00
48      J90     الانصباب الجنبي — Pleural Effusion      الجهاز التنفسي  surgery 2026-07-02 09:20:42.488184+00
49      J93     الانخماص الرئوي — Pneumothorax  الجهاز التنفسي  surgery 2026-07-02 09:20:42.488184+00
50      C34     سرطان الرئة — Lung Cancer       الجهاز التنفسي  surgery 2026-07-02 09:20:42.488184+00
51      J86     الدبيلة الجنبية — Empyema Thoracis      الجهاز التنفسي  surgery 2026-07-02 09:20:42.488184+00
52      I21     احتشاء عضلة القلب الحاد — Acute Myocardial Infarction (MI)      القلب والأوعية  surgery 2026-07-02 09:20:42.488184+00
53      I63     السكتة الدماغية الإقفارية — Ischemic Stroke     القلب والأوعية  surgery 2026-07-02 09:20:42.488184+00
54      I50     قصور القلب الاحتقاني — Congestive Heart Failure (CHF)   القلب والأوعية  surgery 2026-07-02 09:20:42.488184+00
55      I46     السكتة القلبية — Cardiac Arrest طوارئ   surgery 2026-07-02 09:20:42.488184+00
56      I48     الرجفان الأذيني — Atrial Fibrillation   القلب والأوعية  surgery 2026-07-02 09:20:42.488184+00
57      I20     الذبحة الصدرية — Angina Pectoris        القلب والأوعية  surgery 2026-07-02 09:20:42.488184+00
58      I25     داء الشريان التاجي المزمن — Chronic Coronary Artery Disease     القلب والأوعية  surgery 2026-07-02 09:20:42.488184+00
59      I10     ارتفاع ضغط الدم الأساسي — Essential Hypertension        القلب والأوعية  surgery 2026-07-02 09:20:42.488184+00
60      I83     دوالي الأوردة — Varicose Veins  الجراحة الوعائية        surgery 2026-07-02 09:20:42.488184+00
61      I80     التهاب الوريد الخثاري — Deep Vein Thrombosis (DVT)      الجراحة الوعائية        surgery 2026-07-02 09:20:42.488184+00
62      I71.4   تمدد الأورطي البطني — Abdominal Aortic Aneurysm (AAA)   الجراحة الوعائية        surgery 2026-07-02 09:20:42.488184+00
63      I73.9   مرض الشريان المحيطي — Peripheral Artery Disease (PAD)   الجراحة الوعائية        surgery 2026-07-02 09:20:42.488184+00
64      I26     الانسداد الرئوي — Pulmonary Embolism (PE)       الجراحة الوعائية        surgery 2026-07-02 09:20:42.488184+00
65      I82     الجلطة الوريدية العميقة — Venous Thromboembolism        الجراحة الوعائية        surgery 2026-07-02 09:20:42.488184+00
66      N20     حصوات الكلى — Kidney Stones (Urolithiasis)      الجهاز البولي   surgery 2026-07-02 09:20:42.488184+00
67      C67     سرطان المثانة — Bladder Cancer  الجهاز البولي   surgery 2026-07-02 09:20:42.488184+00
68      C61     سرطان البروستاتا — Prostate Cancer      الجهاز البولي   surgery 2026-07-02 09:20:42.488184+00
69      N40     تضخم البروستاتا الحميد — BPH    الجهاز البولي   surgery 2026-07-02 09:20:42.488184+00
70      N10     التهاب الحويضة والكلية الحاد — Acute Pyelonephritis     الجهاز البولي   surgery 2026-07-02 09:20:42.488184+00
71      N18     الفشل الكلوي المزمن — Chronic Kidney Disease (CKD)      الجهاز البولي   surgery 2026-07-02 09:20:42.488184+00
72      N39.0   التهاب المسالك البولية — Urinary Tract Infection (UTI)  الجهاز البولي   surgery 2026-07-02 09:20:42.488184+00
73      N44     التواء الخصية — Testicular Torsion      الجهاز البولي   surgery 2026-07-02 09:20:42.488184+00
74      E11     السكري من النوع الثاني — Type 2 Diabetes Mellitus       الغدد الصماء    surgery 2026-07-02 09:20:42.488184+00
75      E10     السكري من النوع الأول — Type 1 Diabetes Mellitus        الغدد الصماء    surgery 2026-07-02 09:20:42.488184+00
76      E04     تضخم الغدة الدرقية — Goiter (Non-toxic) جراحة الغدد     surgery 2026-07-02 09:20:42.488184+00
77      C73     سرطان الغدة الدرقية — Thyroid Cancer    جراحة الغدد     surgery 2026-07-02 09:20:42.488184+00
78      E05     فرط نشاط الغدة الدرقية — Hyperthyroidism        الغدد الصماء    surgery 2026-07-02 09:20:42.488184+00
79      E03     قصور الغدة الدرقية — Hypothyroidism     الغدد الصماء    surgery 2026-07-02 09:20:42.488184+00
80      E11.10  الحماض الكيتوني السكري — Diabetic Ketoacidosis (DKA)    طوارئ   surgery 2026-07-02 09:20:42.488184+00
81      G40     الصرع — Epilepsy        الجهاز العصبي   surgery 2026-07-02 09:20:42.488184+00
82      G43     الصداع النصفي — Migraine        الجهاز العصبي   surgery 2026-07-02 09:20:42.488184+00
83      G20     مرض باركنسون — Parkinson's Disease      الجهاز العصبي   surgery 2026-07-02 09:20:42.488184+00
84      G30     مرض الزهايمر — Alzheimer's Disease      الجهاز العصبي   surgery 2026-07-02 09:20:42.488184+00
85      G03     التهاب السحايا — Meningitis     الجهاز العصبي   surgery 2026-07-02 09:20:42.488184+00
86      G45     النوبة الإقفارية العابرة — TIA  الجهاز العصبي   surgery 2026-07-02 09:20:42.488184+00
87      I61     السكتة الدماغية النزفية — Hemorrhagic Stroke    الجهاز العصبي   surgery 2026-07-02 09:20:42.488184+00
88      S72     كسر في عظم الفخذ — Femur/Hip Fracture   عظام ومفاصل     surgery 2026-07-02 09:20:42.488184+00
89      S52     كسر الساعد — Radius/Ulna Fracture       عظام ومفاصل     surgery 2026-07-02 09:20:42.488184+00
90      M51.1   الانزلاق الغضروفي — Intervertebral Disc Herniation      عظام ومفاصل     surgery 2026-07-02 09:20:42.488184+00
91      M54.5   ألم أسفل الظهر المزمن — Chronic Low Back Pain   عظام ومفاصل     surgery 2026-07-02 09:20:42.488184+00
92      M05     التهاب المفاصل الروماتويدي — Rheumatoid Arthritis       عظام ومفاصل     surgery 2026-07-02 09:20:42.488184+00
93      M17     التهاب مفصل الركبة — Knee Osteoarthritis        عظام ومفاصل     surgery 2026-07-02 09:20:42.488184+00
94      M10     النقرس — Gout   عظام ومفاصل     surgery 2026-07-02 09:20:42.488184+00
95      M45     التهاب الفقار اللاصق — Ankylosing Spondylitis   عظام ومفاصل     surgery 2026-07-02 09:20:42.488184+00
96      L03     التهاب النسيج الخلوي — Cellulitis       الجلد   surgery 2026-07-02 09:20:42.488184+00
97      L70     حب الشباب — Acne Vulgaris       الجلد   surgery 2026-07-02 09:20:42.488184+00
98      B00     الهربس البسيط — Herpes Simplex  الجلد   surgery 2026-07-02 09:20:42.488184+00
99      L50     الشرى — Urticaria (Hives)       الجلد   surgery 2026-07-02 09:20:42.488184+00
100     T30     الحروق — Burns (1st/2nd/3rd Degree)     الجلد   surgery 2026-07-02 09:20:42.488184+00
101     C43     سرطان الجلد الميلانيني — Melanoma       الجلد   surgery 2026-07-02 09:20:42.488184+00
102     L89     قرحة الفراش — Pressure Ulcer / Bedsore  الجلد   surgery 2026-07-02 09:20:42.488184+00
103     N73     التهاب الحوض — Pelvic Inflammatory Disease (PID)        النساء والتوليد surgery 2026-07-02 09:20:42.488184+00
104     N83.2   الكيسة المبيضية — Ovarian Cyst  النساء والتوليد surgery 2026-07-02 09:20:42.488184+00
105     D25     الورم الليفي الرحمي — Uterine Fibroids (Myoma)  النساء والتوليد surgery 2026-07-02 09:20:42.488184+00
106     O00     الحمل خارج الرحم — Ectopic Pregnancy    النساء والتوليد surgery 2026-07-02 09:20:42.488184+00
107     C53     سرطان عنق الرحم — Cervical Cancer       النساء والتوليد surgery 2026-07-02 09:20:42.488184+00
108     C50     سرطان الثدي — Breast Cancer     جراحة الثدي     surgery 2026-07-02 09:20:42.488184+00
109     B34.9   العدوى الفيروسية العامة — General Viral Infection       الأمراض المعدية surgery 2026-07-02 09:20:42.488184+00
110     J10     الإنفلونزا — Influenza  الأمراض المعدية surgery 2026-07-02 09:20:42.488184+00
111     A09     الإسهال الحاد / التهاب المعدة والأمعاء — Acute Gastroenteritis  الأمراض المعدية surgery 2026-07-02 09:20:42.488184+00
112     A41     الإنتان / تعفن الدم — Sepsis    طوارئ   surgery 2026-07-02 09:20:42.488184+00
113     A41.9   الصدمة الإنتانية — Septic Shock طوارئ   surgery 2026-07-02 09:20:42.488184+00
114     A15     الدرن الرئوي — Pulmonary Tuberculosis   الأمراض المعدية surgery 2026-07-02 09:20:42.488184+00
115     U07.1   كوفيد-19 — COVID-19     الأمراض المعدية surgery 2026-07-02 09:20:42.488184+00
116     R50.9   الحمى المجهولة السبب — Fever of Unknown Origin (FUO)    الأمراض المعدية surgery 2026-07-02 09:20:42.488184+00
117     J06     التهاب السبيل التنفسي العلوي — Upper Respiratory Tract Infection        الأمراض المعدية surgery 2026-07-02 09:20:42.488184+00
118     J00     التهاب الأنف والبلعوم — Nasopharyngitis (Common Cold)   أنف وأذن وحنجرة surgery 2026-07-02 09:20:42.488184+00
119     J03     التهاب اللوزتين — Tonsillitis   أنف وأذن وحنجرة surgery 2026-07-02 09:20:42.488184+00
120     J32     التهاب الجيوب الأنفية — Chronic Sinusitis       أنف وأذن وحنجرة surgery 2026-07-02 09:20:42.488184+00
121     H66     التهاب الأذن الوسطى الحاد — Acute Otitis Media  أنف وأذن وحنجرة surgery 2026-07-02 09:20:42.488184+00
122     H40     الجلوكوما / الماء الأزرق — Glaucoma     العيون  surgery 2026-07-02 09:20:42.488184+00
123     H26     الكتاراكت / الماء الأبيض — Cataract     العيون  surgery 2026-07-02 09:20:42.488184+00
124     H10     التهاب الملتحمة — Conjunctivitis        العيون  surgery 2026-07-02 09:20:42.488184+00
125     F32     الاكتئاب الشديد — Major Depressive Disorder     الأمراض النفسية surgery 2026-07-02 09:20:42.488184+00
126     F41.1   اضطراب القلق العام — Generalized Anxiety Disorder (GAD) الأمراض النفسية surgery 2026-07-02 09:20:42.488184+00
127     F41.0   اضطراب الهلع — Panic Disorder   الأمراض النفسية surgery 2026-07-02 09:20:42.488184+00
128     D50     فقر الدم بنقص الحديد — Iron Deficiency Anemia   أمراض الدم      surgery 2026-07-02 09:20:42.488184+00
129     D57     فقر الدم المنجلي — Sickle Cell Anemia   أمراض الدم      surgery 2026-07-02 09:20:42.488184+00
130     D56     الثلاسيميا — Thalassemia        أمراض الدم      surgery 2026-07-02 09:20:42.488184+00
131     D69     نقص الصفيحات الدموية — Thrombocytopenia أمراض الدم      surgery 2026-07-02 09:20:42.488184+00
132     T78.2   الصدمة التحسسية — Anaphylactic Shock    طوارئ   surgery 2026-07-02 09:20:42.488184+00
133     A05.9   التسمم الغذائي — Food Poisoning طوارئ   surgery 2026-07-02 09:20:42.488184+00
134     R57.1   الصدمة النزفية — Hemorrhagic Shock      طوارئ   surgery 2026-07-02 09:20:42.488184+00
135     R55     الإغماء — Syncope/Fainting      طوارئ   surgery 2026-07-02 09:20:42.488184+00
136     T31     الحروق الشديدة — Severe Burns (Major Burns)     طوارئ   surgery 2026-07-02 09:20:42.488184+00
137     T14     إصابات متعددة — Multiple Trauma طوارئ   surgery 2026-07-02 09:20:42.488184+00
138     S06     إصابة الدماغ الرضية — Traumatic Brain Injury (TBI)      طوارئ   surgery 2026-07-02 09:20:42.488184+00
139     S27     صدمة الصدر — Chest Trauma / Pneumothorax        طوارئ   surgery 2026-07-02 09:20:42.488184+00
140     J81     وذمة الرئة الحادة — Acute Pulmonary Edema       طوارئ   surgery 2026-07-02 09:20:42.488184+00
141     Z00.0   فحص طبي دوري — General Medical Check-up وقائي   surgery 2026-07-02 09:20:42.488184+00
142     Z30     استشارة صحية — Health Consultation      وقائي   surgery 2026-07-02 09:20:42.488184+00
143     Z01     فحص وقائي قبل الجراحة — Pre-operative Assessment        وقائي   surgery 2026-07-02 09:20:42.488184+00
144     Z03     مراقبة حالة مشتبه بها — Observation/Rule-Out    وقائي   surgery 2026-07-02 09:20:42.488184+00
145     R11     الغثيان والقيء — Nausea and Vomiting    الجهاز الهضمي   surgery 2026-07-02 09:20:42.488184+00
146     R51     الصداع — Headache       الجهاز العصبي   surgery 2026-07-02 09:20:42.488184+00
147     R05     السعال — Cough  الجهاز التنفسي  surgery 2026-07-02 09:20:42.488184+00
148     R07     ألم الصدر — Chest Pain  القلب والأوعية  surgery 2026-07-02 09:20:42.488184+00
149     R42     الدوخة — Dizziness/Vertigo      الجهاز العصبي   surgery 2026-07-02 09:20:42.488184+00
150     R60     الوذمة — Generalized Edema      طوارئ   surgery 2026-07-02 09:20:42.488184+00
\.


--
-- Data for Name: lab_tests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lab_tests (id, code, name, name_en, category, price_official, price, consumables_cost, price_cost, is_l2l, kit, kit_qty, kit_unit, kit_threshold, time_estimate, created_at) FROM stdin;
1       CBC     CBC     CBC     تحاليل الدم     30.00   30.00   0.00    15.00   f       syringe + needle +alcohol swap + EDTA tube +diluant     0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
2       ESR     ESR     ESR     تحاليل الدم     25.00   25.00   0.00    10.00   f       syringe + needle +alcohol swap + ESR Tube       0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
3       PT      PT      PT      تحاليل الدم     30.00   30.00   0.00    10.00   f       syringe +needle +alcohol swap + Na citrate tube +test tube +Pt reagent  0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
4       PTT     PTT     PTT     تحاليل الدم     30.00   30.00   0.00    10.00   f       syringe +needle +alcohol swap + Na citrate tube +test tube +aPtt reagent        0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
5       BLOODGROUP      Blood group     Blood group     تحاليل الدم     20.00   20.00   0.00    10.00   f       lancet +slide+wodden stick +ABO reagent 0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
6       BHCG-   BHCG(+/-)       BHCG(+/-)       الهرمونات       20.00   20.00   0.00    10.00   f       syring +needle +alcohol swap +test tube + kit ( exp 24.6.2027)  0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
7       BHCGTITER       BHCG Titer      BHCG Titer      الهرمونات       70.00   70.00   0.00    30.00   f       syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp3.2.2028 )       0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
8       BUN     BUN     BUN     الكيمياء الحيوية        25.00   25.00   0.00    10.00   f       syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage        0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
9       CREATININ       Creatinin       Creatinin       الكيمياء الحيوية        25.00   25.00   0.00    10.00   f       syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage        0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
10      CHOLESTEROL     Cholesterol     Cholesterol     الكيمياء الحيوية        25.00   25.00   0.00    10.00   f       syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage        0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
11      LDL     LDL     LDL     الكيمياء الحيوية        30.00   30.00   0.00    15.00   f       syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage        0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
12      HDL     HDL     HDL     الكيمياء الحيوية        25.00   25.00   0.00    15.00   f       syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage        0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
13      TG      TG      TG      الكيمياء الحيوية        25.00   25.00   0.00    10.00   f       syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp22.9.2027)       0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
14      FSH     FSH     FSH     الهرمونات       60.00   60.00   0.00    20.00   f       syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage        0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
15      FERRITIN        Ferritin        Ferritin        الهرمونات       80.00   80.00   0.00    35.00   f       syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp 12.3.2.2028)    0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
16      FT4     F T4    F T4    الهرمونات       60.00   60.00   0.00    20.00   f       syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp 13.10.2027)     0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
17      FT3     F T3    F T3    الهرمونات       60.00   60.00   0.00    20.00   f       syring +needle +alcohol swap +plain tube +yellow tip +kit       0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
18      FOLATEFOLICA    Folate (folic acid )    Folate (folic acid )    الهرمونات       80.00   80.00   0.00    40.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
19      PROLACTINPRL    Prolactin (PRL) Prolactin (PRL) الهرمونات       60.00   60.00   0.00    20.00   f       syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp 13.10.2027)     0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
20      LH      LH      LH      الهرمونات       60.00   60.00   0.00    20.00   f       syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp27.8.2027)       0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
21      LDH     LDH     LDH     أخرى    40.00   40.00   0.00    20.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
22      ASOT    ASOT    ASOT    أخرى    25.00   25.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
23      ANA     ANA     ANA     أخرى    100.00  100.00  0.00    45.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
24      AMH     AMH     AMH     الهرمونات       200.00  200.00  0.00    120.00  f       syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp22.9.2027)       0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
25      E2      E2      E2      أخرى    70.00   70.00   0.00    30.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
26      PROGESTERON     Progesteron     Progesteron     أخرى    70.00   70.00   0.00    30.00   f       syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp 12.11.2027)     0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
27      PHPSPHORUS      Phpsphorus      Phpsphorus      أخرى    25.00   25.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
28      CA      Ca      Ca      أخرى    30.00   30.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
29      MG      Mg      Mg      أخرى    50.00   50.00   0.00    20.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
30      CL      Cl      Cl      أخرى    25.00   25.00   0.00    15.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
31      K       K       K       أخرى    30.00   30.00   0.00    20.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
32      NA      Na      Na      أخرى    30.00   30.00   0.00    20.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
33      ELECTROLYTE     Electrolyte     Electrolyte     أخرى    85.00   85.00   0.00    55.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
34      VIT-D   Vit - D Vit - D أخرى    150.00  150.00  0.00    100.00  f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
35      VIT-B12 vit - B 12      vit - B 12      أخرى    90.00   90.00   0.00    40.00   f       syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp9.11.2027)       0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
36      URINEANALYSI    urine analysis  urine analysis  أخرى    20.00   20.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
37      URICACID        uric acid       uric acid       أخرى    25.00   25.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
38      SEMINALFLUID    Seminal Fluid   Seminal Fluid   أخرى    50.00   50.00   0.00    25.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
39      SEMINALCULTU    Seminal culture Seminal culture الأمراض المعدية 50.00   50.00   0.00    25.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
40      STOOLANALYSI    stool analysis  stool analysis  تحاليل البول    20.00   20.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
41      STOOLCULTURE    stool culture   stool culture   تحاليل البول    60.00   60.00   0.00    25.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
42      URINECULTURE    urine culture   urine culture   الأمراض المعدية 50.00   50.00   0.00    25.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
43      HVCCULTURE      HVC Culture     HVC Culture     الأمراض المعدية 50.00   50.00   0.00    20.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
44      TSH     TSH     TSH     الهرمونات       60.00   60.00   0.00    20.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
45      TESTOSTERONT    Testosteron total       Testosteron total       أخرى    100.00  100.00  0.00    40.00   f       syring +needle +alcohol swap +plain tube +yellow tip +kit       0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
46      FREETESTO       Free Testo      Free Testo      أخرى    100.00  100.00  0.00    50.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
47      TROPONIN-       Troponin (+/-)  Troponin (+/-)  أخرى    70.00   70.00   0.00    30.00   f       syring +needle +alcohol swap +plain tube +kit ( exp 17.12.2027) 0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
48      TIBC    TIBC    TIBC    أخرى    50.00   50.00   0.00    20.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
49      TRANSFIRRIN     Transfirrin     Transfirrin     أخرى    100.00  100.00  0.00    60.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
50      TOTALPROTIEN    Total Protien   Total Protien   أخرى    25.00   25.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
51      TORCHIGG        TORCH IgG       TORCH IgG       أخرى    250.00  250.00  0.00    120.00  f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
52      CPK     CPK     CPK     أخرى    40.00   40.00   0.00    20.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
53      COOMBSDIRECT    Coombs direct   Coombs direct   أخرى    60.00   60.00   0.00    25.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
54      ICTTITER        ICTTiter        ICTTiter        أخرى    60.00   60.00   0.00    25.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
55      C-PIPTIDE       C - piptide     C - piptide     تحاليل الدم     200.00  200.00  0.00    90.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
56      CRP     CRP     CRP     أخرى    30.00   30.00   0.00    15.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
57      HBS     Hbs     Hbs     أخرى    60.00   60.00   0.00    20.00   f       syring +needle +alcohol swap +plain tube  +kit ( exp18.12.2027) 0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
58      RBS     RBS     RBS     أخرى    20.00   20.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
59      RUBELLA Rubella Rubella الأمراض المعدية 70.00   70.00   0.00    25.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
60      HPYLORISTOOL    H.pylori stool  H.pylori stool  تحاليل البول    80.00   80.00   0.00    30.00   f       cup non-sterile +kit(exp 30.10.2027 )   0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
61      HPYLORISERUM    H.pylori serum  H.pylori serum  أخرى    100.00  100.00  0.00    80.00   f       syring +needle +alcohol swap +plain tube +kits ( exp 19.9.2026) 0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
62      OCCULTBLOOD     Occult blood    Occult blood    أخرى    40.00   40.00   0.00    20.00   f       cup non-sterile +kit(exp 13.11.2027)    0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
63      D-DIMER D-Dimer D-Dimer أخرى    140.00  140.00  0.00    70.00   f       syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp 18.11.2027      0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
64      ANTICARDIOLI    Anti Cardiolipin        Anti Cardiolipin        أخرى    100.00  100.00  0.00    50.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
65      ANTIPHOSPHOL    Anti Phospholipid       Anti Phospholipid       أخرى    150.00  150.00  0.00    70.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
66      THROMPOPHILI    Thrompophilia panle (12 mutation )      Thrompophilia panle (12 mutation )      أخرى    850.00  850.00  0.00    500.00  f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
67      RF      RF      RF      أخرى    50.00   50.00   0.00    0.00    f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
68      IRON    Iron    Iron    أخرى    40.00   40.00   0.00    20.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
69      HBELECTROPHO    Hb Electrophoresis      Hb Electrophoresis      أخرى    150.00  150.00  0.00    100.00  f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
70      RETICCELL       Retic Cell      Retic Cell      أخرى    50.00   50.00   0.00    30.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
71      INSULIN Insulin Insulin الهرمونات       150.00  150.00  0.00    70.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
72      HA1C    HA1C    HA1C    أخرى    60.00   60.00   0.00    25.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
73      BLOODFILIM      Blood filim     Blood filim     أخرى    100.00  100.00  0.00    50.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
74      BILIROBINTOT    Bilirobin Total Bilirobin Total أخرى    30.00   30.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
75      BILIROBINDIR    Bilirobin Direct        Bilirobin Direct        أخرى    25.00   25.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
76      GCT     GCT     GCT     أخرى    50.00   50.00   0.00    20.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
77      GTT     GTT     GTT     أخرى    70.00   70.00   0.00    30.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
78      ALTGPT  ALT(GPT)        ALT(GPT)        تحاليل الدم     25.00   25.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
79      GGT     GGT     GGT     أخرى    40.00   40.00   0.00    15.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
80      ALP     ALP     ALP     أخرى    25.00   25.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
81      ALBUMIN Albumin Albumin أخرى    25.00   25.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
82      ASTGOT  AST (GOT)       AST (GOT)       أخرى    25.00   25.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
83      FBS     FBS     FBS     أخرى    20.00   20.00   0.00    10.00   f               0.00    وحدة    10.00   فوري    2026-07-01 18:32:36.917302+00
\.


--
-- Data for Name: rad_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rad_catalog (id, code, name, device, price, time_val, time_unit, instructions, notes, created_at) FROM stdin;
1       XR-CHEST        صورة صدر (X-Ray)        X-Ray   120.00  فوري                            2026-07-01 18:32:37.427426+00
2       XR-HAND صورة يد (X-Ray) X-Ray   80.00   فوري                            2026-07-01 18:32:37.427426+00
3       XR-SPINE        صورة عمود فقري (X-Ray)  X-Ray   150.00  فوري                            2026-07-01 18:32:37.427426+00
4       CT-HEAD أشعة مقطعية — رأس (CT)  CT Scanner      350.00  30      دقيقة                   2026-07-01 18:32:37.427426+00
5       CT-ABD  أشعة مقطعية — بطن (CT)  CT Scanner      380.00  30      دقيقة   يُمنع الأكل 4 ساعات قبل الفحص           2026-07-01 18:32:37.427426+00
6       MRI-KNEE        رنين مغناطيسي — ركبة (MRI)      MRI     500.00  1       ساعة    إزالة المعادن           2026-07-01 18:32:37.427426+00
7       US-ABD  تصوير بالموجات فوق صوتية        Ultrasound      200.00  20      دقيقة                   2026-07-01 18:32:37.427426+00
8       MAMMO   تصوير الثدي (Mammogram) Mammography     280.00  30      دقيقة                   2026-07-01 18:32:37.427426+00
\.


--
-- Data for Name: sidebar_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sidebar_settings (id, hidden_sections, hide_revenue_from_staff, updated_at) FROM stdin;
1       {}      t       2026-07-02 07:35:08.355853+00
\.


--
-- Name: admin_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_accounts_id_seq', 34, true);


--
-- Name: diagnoses_catalog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.diagnoses_catalog_id_seq', 150, true);


--
-- Name: lab_tests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lab_tests_id_seq', 83, true);


--
-- Name: rad_catalog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rad_catalog_id_seq', 8, true);


--
-- Name: sidebar_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sidebar_settings_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--

\unrestrict sryyD4WTQ4e1rC89yIynWC66M8cXPT9pmsrE4lnICz2pQ1cBe6hILG6eCQFphS2

