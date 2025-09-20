-- Insert additional Albanian blog content
INSERT INTO public.content_master
  (page, content_type, filter_type, language, title, subtitle, slug, category, stage, subject, tags, is_published, published_at, excerpt, content)
VALUES
  ('research_blog', 'blog', 'Teaching Techniques', 'sq',
   'Strategji për të nxitur të menduarit kritik',
   'Pyetje të hapura që frymëzojnë reflektim në klasë',
   'strategji-mendim-kritik-sq',
   'Assessment', 'Secondary', 'Global Perspective', ARRAY['kritik', 'pyetje', 'reflektim'],
   true, now(),
   'Një seri strategjish pyetjesh që ndihmojnë nxënësit të lidhin mësimin me situata reale.',
   '{"blocks": [{"type": "paragraph", "data": {"text": "Përdorni metoda si mendimi me katër hapa, fletë reflektimi dhe debatet e strukturuara për të zgjuar kureshtjen e nxënësve."}}]}'::jsonb),
  ('edutech', 'blog', 'Edu Tech', 'sq',
   'Platforma të reja për bashkëpunim në distancë',
   'Si të mbani gjallë diskutimet online të klasës',
   'platforma-bashkepunimi-online-sq',
   'Engagement', 'High School', 'ICT', ARRAY['bashkepunim', 'online', 'platforma'],
   true, now(),
   'Sugjerime për aplikacione që integrojnë forume, kuize dhe tabela interaktive në shqip.',
   '{"blocks": [{"type": "paragraph", "data": {"text": "Artikulli shqyrton mjete që ofrojnë përkthim automatik dhe analitikë për pjesëmarrjen, duke u përshtatur me nevojat e klasave shqiptare."}}]}'::jsonb),
  ('teacher_diary', 'diary_entry', 'Teacher Reflection', 'sq',
   'Ditari: Eksperimenti i parë me projektet STEAM',
   'Çfarë funksionoi dhe çfarë do të ndryshoja',
   'ditari-projektet-steam-sq',
   'Lesson Planning', 'K-9', 'STEAM', ARRAY['steam', 'projekt', 'reflektim'],
   true, now(),
   'Një mësuese tregon si organizoi ekipet dhe materialet për një projekt të integruar shkencë-art.',
   '{"blocks": [{"type": "paragraph", "data": {"text": "Përshkrimi përfshin listën e materialeve të riciklueshme, mënyrën e vlerësimit dhe reagimet e nxënësve gjatë prezantimeve."}}]}'::jsonb);

-- Insert additional Vietnamese blog content
INSERT INTO public.content_master
  (page, content_type, filter_type, language, title, subtitle, slug, category, stage, subject, tags, is_published, published_at, excerpt, content)
VALUES
  ('research_blog', 'blog', 'Teaching Techniques', 'vi',
   'Chiến lược khơi gợi tư duy phản biện',
   'Câu hỏi mở giúp học sinh kết nối kiến thức',
   'chien-luoc-tu-duy-phan-bien-vi',
   'Assessment', 'Secondary', 'Global Perspective', ARRAY['phan bien', 'cau hoi', 'phan xa'],
   true, now(),
   'Các bước thiết kế câu hỏi và hoạt động giúp học sinh suy nghĩ sâu và phản ánh.',
   '{"blocks": [{"type": "paragraph", "data": {"text": "Bài viết gợi ý khung câu hỏi bốn bước, bảng phản chiếu và phiên tranh luận mini để tăng cường đối thoại trên lớp."}}]}'::jsonb),
  ('edutech', 'blog', 'Edu Tech', 'vi',
   'Công cụ mới cho hợp tác trực tuyến',
   'Giữ lửa thảo luận khi học sinh học từ xa',
   'cong-cu-hop-tac-truc-tuyen-vi',
   'Engagement', 'High School', 'ICT', ARRAY['hop tac', 'truc tuyen', 'ung dung'],
   true, now(),
   'Danh sách ứng dụng hỗ trợ diễn đàn, bảng tư duy và phân tích tương tác bằng tiếng Việt.',
   '{"blocks": [{"type": "paragraph", "data": {"text": "Các công cụ được giới thiệu tích hợp phụ đề, ghi chú chung và báo cáo mức độ tham gia để giáo viên điều chỉnh hoạt động."}}]}'::jsonb),
  ('teacher_diary', 'diary_entry', 'Teacher Reflection', 'vi',
   'Nhật ký: Dự án STEAM đầu tiên của lớp tôi',
   'Những bài học sau tuần lễ triển lãm',
   'nhat-ky-du-an-steam-vi',
   'Lesson Planning', 'K-9', 'STEAM', ARRAY['steam', 'du an', 'trai nghiem'],
   true, now(),
   'Giáo viên chia sẻ cách phân vai, chuẩn bị nguyên liệu và đánh giá sản phẩm STEAM.',
   '{"blocks": [{"type": "paragraph", "data": {"text": "Nhật ký mô tả bảng phân công nhiệm vụ, công cụ phản hồi nhanh và cảm xúc của học sinh khi trình bày sản phẩm."}}]}'::jsonb);
