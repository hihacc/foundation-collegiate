import { redirect } from 'next/navigation';

export default function ClassesRedirect() {
  // Classes and Levels logic is handled within the main Courses page
  redirect('/courses');
}
