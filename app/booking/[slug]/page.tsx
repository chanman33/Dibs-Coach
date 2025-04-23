import { redirect } from 'next/navigation';

interface BookingPageProps {
  params: {
    slug: string;
  };
}

export default function BookingPage({ params }: BookingPageProps) {
  const { slug } = params;
  
  // Redirect to the availability page with the slug as a query parameter
  redirect(`/booking/availability?slug=${encodeURIComponent(slug)}`);
}
