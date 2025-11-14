-- Initial data for Categories
INSERT INTO categories (name, description, icon) VALUES
('Sports', 'Sports events and physical activities', 'sports'),
('Culture', 'Cultural events, art and entertainment', 'culture'),
('Education', 'Workshops, talks and educational events', 'education'),
('Technology', 'Technology, innovation and development events', 'tech'),
('Gastronomy', 'Culinary and gastronomic events', 'food'),
('Music', 'Concerts and musical events', 'music'),
('Nature', 'Outdoor activities and environment', 'nature'),
('Social', 'Social and networking events', 'social')
ON CONFLICT (name) DO NOTHING;

-- Test user (password: admin123 - you should hash this in production)
INSERT INTO users (name, email, password_hash, phone, role) VALUES
('Administrator', 'admin@azuevento.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '555-0100', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Sample event
INSERT INTO events (title, description, category_id, organizer_id, start_date, end_date, location, max_capacity, visibility, status) VALUES
('Welcome Event', 'First event on the Azuevento platform', 1, 1, CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '7 days' + INTERVAL '3 hours', 'Central Plaza', 100, 'public', 'published')
ON CONFLICT DO NOTHING;
