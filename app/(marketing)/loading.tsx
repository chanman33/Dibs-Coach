// Return an empty fragment instead of null.
// This might be needed for Next.js to correctly override the parent loading UI.
export default function MarketingLoading() {
  return <></>;
} 