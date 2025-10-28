# Initial Data Model

## User
- id
- name
- email
- password_hash
- phone
- profile_picture
- description
- interests (array of categories)
- role (user | co_organizer | admin)
- registration_date
- active

## Event
- id
- title
- description
- category_id
- organizer_id
- start_date
- end_date
- location
- latitude
- longitude
- max_capacity
- cover_image
- visibility (public | private)
- status (draft | published | cancelled | archived)
- created_at
- updated_at
- deleted_at (for soft delete)

## Category
- id
- name
- description
- icon

## Participant (Attendance)
- id
- event_id
- user_id
- registration_date
- attendance_status (confirmed | cancelled | attended | not_attended)

## Favorite
- id
- event_id
- user_id
- created_at

## Comment
- id
- event_id
- user_id
- content
- created_at
- updated_at

## Rating
- id
- event_id
- user_id
- score (1-5)
- comment
- created_at
