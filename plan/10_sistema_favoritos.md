# Favorites System - Azuevento

## 📌 Description

The favorites system allows users to bookmark events of interest for quick access later.

## 🗄️ Database Structure

### `favorites` Table

```sql
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);
```

**Features:**
- ✅ Many-to-many relationship between users and events
- ✅ `UNIQUE(event_id, user_id)` constraint prevents duplicates
- ✅ `ON DELETE CASCADE` removes favorites if event or user is deleted
- ✅ `created_at` to sort by most recent favorites
- ✅ Optimized indexes for fast queries

## 🔧 Main Operations

### 1. Add to Favorites

```sql
-- Mark event as favorite
INSERT INTO favorites (event_id, user_id)
VALUES (123, 456)
ON CONFLICT (event_id, user_id) DO NOTHING;
```

### 2. Remove from Favorites

```sql
-- Unmark event as favorite
DELETE FROM favorites
WHERE event_id = 123 AND user_id = 456;
```

### 3. Check if Favorite

```sql
-- Check if an event is favorite for a user
SELECT EXISTS(
    SELECT 1 FROM favorites
    WHERE event_id = 123 AND user_id = 456
) AS is_favorite;
```

### 4. List User's Favorites

```sql
-- Get all favorite events for a user
SELECT e.*, f.created_at AS favorited_at
FROM events e
INNER JOIN favorites f ON e.id = f.event_id
WHERE f.user_id = 456
ORDER BY f.created_at DESC;
```

### 5. Count Event Favorites

```sql
-- How many users marked an event as favorite
SELECT COUNT(*) AS total_favorites
FROM favorites
WHERE event_id = 123;
```

## 🎯 API Use Cases

### Endpoint: POST /api/events/{eventId}/favorite

**Request:**
```json
{
  "userId": 456
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Event added to favorites",
  "isFavorite": true
}
```

### Endpoint: DELETE /api/events/{eventId}/favorite

**Response (200):**
```json
{
  "success": true,
  "message": "Event removed from favorites",
  "isFavorite": false
}
```

### Endpoint: GET /api/users/{userId}/favorites

**Response (200):**
```json
{
  "favorites": [
    {
      "id": 123,
      "title": "Cuenca Marathon 2026",
      "start_date": "2026-03-15T08:00:00",
      "location": "El Paraíso Park",
      "cover_image": "image_url",
      "favorited_at": "2026-01-27T10:30:00",
      "category": "Sports"
    }
  ],
  "total": 1
}
```

## 📱 React Native Implementation

### Custom Hook

```javascript
// hooks/useFavorites.js
import { useState, useEffect } from 'react';

export const useFavorites = (eventId, userId) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      if (isFavorite) {
        await fetch(`/api/events/${eventId}/favorite`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setIsFavorite(false);
      } else {
        await fetch(`/api/events/${eventId}/favorite`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return { isFavorite, toggleFavorite, loading };
};
```

### Button Component

```javascript
// components/FavoriteButton.js
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFavorites } from '../hooks/useFavorites';

export const FavoriteButton = ({ eventId, userId }) => {
  const { isFavorite, toggleFavorite, loading } = useFavorites(eventId, userId);

  return (
    <TouchableOpacity 
      onPress={toggleFavorite}
      disabled={loading}
    >
      <Icon 
        name={isFavorite ? 'favorite' : 'favorite-border'}
        size={24}
        color={isFavorite ? '#FF6B6B' : '#666'}
      />
    </TouchableOpacity>
  );
};
```

## 🎨 UX Considerations

1. **Immediate Visual Feedback**: Icon should change instantly on click
2. **Animation**: Add a small "heart" animation when marking as favorite
3. **Counter**: Show how many people marked the event as favorite
4. **Quick Access**: Dedicated "My Favorites" section in user profile
5. **Synchronization**: If user marks/unmarks on different devices, it should sync

## 🔐 Security

- ✅ Validate that authenticated user can only modify their own favorites
- ✅ Use JWT tokens for authentication
- ✅ Rate limiting to prevent spam

## 📊 Useful Metrics

```sql
-- Most popular events (most favorites)
SELECT e.title, COUNT(f.id) AS total_favorites
FROM events e
LEFT JOIN favorites f ON e.id = f.event_id
GROUP BY e.id, e.title
ORDER BY total_favorites DESC
LIMIT 10;

-- Most active users (most saved favorites)
SELECT u.name, COUNT(f.id) AS total_favorites
FROM users u
LEFT JOIN favorites f ON u.id = f.user_id
GROUP BY u.id, u.name
ORDER BY total_favorites DESC
LIMIT 10;
```
