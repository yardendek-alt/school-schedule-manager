# לוח מורים חכם

Build a web application for school schedule management and substitute teacher replacement, designed for school vice principals and teachers.

The entire UI must be in Hebrew with full RTL (Right-to-Left) layout support using modern Tailwind CSS and Lucide icons.

### Key Roles & Architecture:

1. Target Users: School Vice Principal (Scheduler) and Teachers.

2. Architecture: Single Page Application with clean navigation (Dashboard, Teachers List, Full Schedule View, Substitute Finder).

3. Design: Clean, institutional, modern dashboard with responsive tables, color-coded badges, and clear action modals.

---

### Core Data Structures (Mock Data & State Management):

1. Teachers:

   - id, name, phone, subjects (array), max_weekly_hours, working_days (Sunday to Friday).

2. Schedule Slots:

   - day_of_week: 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'.

   - period: 1 to 8 (each period represents a class hour).

   - teacher_id.

   - activity_type: 

     - 'הוראה' (Frontal Teaching - e.g., Math, Science)

     - 'שהייה' (Preparation / Staying hour)

     - 'פרטני' (Individual instruction)

     - 'חופש' / 'חלון' (Free window / Not working)

   - class_room / grade (optional, e.g. "כיתה ח'2").

3. Substitution Log:

   - id, date, period, original_teacher_id, substitute_teacher_id, reason, status ('ממתין לאישור', 'אושר', 'בוטל').

---

### Core Views & Features:

1. Dashboard / Master Schedule:

   - Weekly grid view showing hours 1–8 across school days.

   - Filter by Teacher, Subject, or Day.

   - Color code each slot clearly:

     - Blue badge for 'הוראה'

     - Amber/Orange badge for 'שהייה'

     - Purple badge for 'פרטני'

     - Gray/Empty for 'חלון / חופש'

2. Substitute Finder (פיצ'ר מילוי מקום - Core Feature):

   - A dedicated modal or page where the Vice Principal selects:

     - Date & Day of week

     - Missing Teacher

     - Missing Period(s)

   - Dynamic Matching Algorithm:

     When triggered, calculate and rank available substitute teachers based on these criteria:

     1. The teacher is scheduled to work on that day.

     2. During that specific period, the teacher is NOT in 'הוראה' (must be in 'חלון', 'שהייה', or 'פרטני').

     3. Prioritize teachers who teach the same subject.

     4. Prioritize teachers who haven't exceeded their 'max_weekly_hours'.

   - Display eligible candidates sorted by best fit, showing: Name, current status in that hour ('בשהייה' / 'בחלון'), subject match, and a button: "שבץ מורה זה כממלא מקום".

3. Confirmation & Notification Simulation:

   - Once a substitute is assigned, show a confirmation modal.

   - Update the schedule in real-time.

   - Simulate an outbound notification drawer: Show the exact formatted WhatsApp/SMS message that would be sent to both teachers (the missing teacher and the substitute teacher), with recipient phone numbers and a "שלח התראה (סימולציה)" button.

Include rich mock data with at least 6 Israeli teachers, diverse subjects, and full weekly schedules so the application is immediately interactive and functional.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/01ba6fd6-af15-56ce-8b4f-dc157d10f56c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
