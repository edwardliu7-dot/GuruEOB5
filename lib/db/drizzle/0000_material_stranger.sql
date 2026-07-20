CREATE TABLE "guru_eob5_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nisn" text,
	"nama_lengkap" text NOT NULL,
	"kelas" text NOT NULL,
	"jenis_kelamin" text NOT NULL,
	"school" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"teacher_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"file_data" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text,
	"file_size" integer,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"teacher_id" text NOT NULL,
	"tanggal" date NOT NULL,
	"kelas" text NOT NULL,
	"materi" text NOT NULL,
	"catatan" text,
	"prosem_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"calendar_id" uuid NOT NULL,
	"jenis" text NOT NULL,
	"lingkup_materi" integer,
	"tp_number" integer,
	"nilai" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"jenis" text NOT NULL,
	"poin" numeric NOT NULL,
	"keterangan" text NOT NULL,
	"tanggal" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_calendars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school" text NOT NULL,
	"created_by" text NOT NULL,
	"tahun_ajaran" text NOT NULL,
	"semester" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" uuid NOT NULL,
	"pekan_ke" integer NOT NULL,
	"tanggal_mulai" date NOT NULL,
	"tanggal_selesai" date NOT NULL,
	"jenis" text NOT NULL,
	"keterangan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prosem_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prosem_id" uuid NOT NULL,
	"week_id" uuid NOT NULL,
	"kd" text,
	"materi" text NOT NULL,
	"jp" integer,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prosem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"calendar_id" uuid NOT NULL,
	"kelas" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_modul_ajar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"materi" text NOT NULL,
	"alokasi_waktu" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_soal_otomatis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"materi" text NOT NULL,
	"jumlah_soal" integer NOT NULL,
	"jenis_soal" text NOT NULL,
	"tingkat_kesulitan" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"tomat_student_id" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tujuan_pembelajaran" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"calendar_id" uuid NOT NULL,
	"lingkup_materi" integer NOT NULL,
	"tp_number" integer NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" text NOT NULL,
	"teacher_name" text NOT NULL,
	"kategori" text NOT NULL,
	"pesan" text NOT NULL,
	"screenshot_base64" text,
	"page_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bahan_ajar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school" text NOT NULL,
	"judul" text NOT NULL,
	"mata_pelajaran" text,
	"kelas" text,
	"deskripsi" text,
	"file_name" text,
	"file_type" text,
	"file_size" integer,
	"file_data" text,
	"link_url" text,
	"created_by" text NOT NULL,
	"created_by_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_prosem_item_id_prosem_items_id_fk" FOREIGN KEY ("prosem_item_id") REFERENCES "public"."prosem_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_guru_eob5_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."guru_eob5_students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_guru_eob5_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."guru_eob5_students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_records" ADD CONSTRAINT "point_records_student_id_guru_eob5_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."guru_eob5_students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_weeks" ADD CONSTRAINT "academic_weeks_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prosem_items" ADD CONSTRAINT "prosem_items_prosem_id_prosem_id_fk" FOREIGN KEY ("prosem_id") REFERENCES "public"."prosem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prosem_items" ADD CONSTRAINT "prosem_items_week_id_academic_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."academic_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prosem" ADD CONSTRAINT "prosem_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prosem" ADD CONSTRAINT "prosem_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_modul_ajar" ADD CONSTRAINT "ai_modul_ajar_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_soal_otomatis" ADD CONSTRAINT "ai_soal_otomatis_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_accounts" ADD CONSTRAINT "student_accounts_student_id_guru_eob5_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."guru_eob5_students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tujuan_pembelajaran" ADD CONSTRAINT "tujuan_pembelajaran_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tujuan_pembelajaran" ADD CONSTRAINT "tujuan_pembelajaran_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "guru_eob5_students_school_nisn_unique" ON "guru_eob5_students" USING btree ("school","nisn") WHERE "guru_eob5_students"."nisn" IS NOT NULL AND "guru_eob5_students"."nisn" <> '';--> statement-breakpoint
CREATE UNIQUE INDEX "subjects_teacher_name_unique" ON "subjects" USING btree ("teacher_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_student_subject_tanggal_unique" ON "attendance_records" USING btree ("student_id","subject_id","tanggal");--> statement-breakpoint
CREATE UNIQUE INDEX "grades_formatif_unique" ON "grades" USING btree ("student_id","subject_id","calendar_id","lingkup_materi","tp_number") WHERE "grades"."jenis" = 'formatif';--> statement-breakpoint
CREATE UNIQUE INDEX "grades_sumatif_lm_unique" ON "grades" USING btree ("student_id","subject_id","calendar_id","lingkup_materi") WHERE "grades"."jenis" = 'sumatif_lm';--> statement-breakpoint
CREATE UNIQUE INDEX "grades_sumatif_tengah_unique" ON "grades" USING btree ("student_id","subject_id","calendar_id") WHERE "grades"."jenis" = 'sumatif_tengah';--> statement-breakpoint
CREATE UNIQUE INDEX "grades_sumatif_akhir_unique" ON "grades" USING btree ("student_id","subject_id","calendar_id") WHERE "grades"."jenis" = 'sumatif_akhir';--> statement-breakpoint
CREATE UNIQUE INDEX "student_accounts_student_id_unique" ON "student_accounts" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tujuan_pembelajaran_unique" ON "tujuan_pembelajaran" USING btree ("subject_id","calendar_id","tp_number");