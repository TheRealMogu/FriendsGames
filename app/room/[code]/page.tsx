import RoomClient from "./RoomClient";

// Server component: sblocca i params (Promise in Next 15) e passa il codice
// al componente client che gestisce Realtime e l'appartenenza.
export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <RoomClient code={code.toUpperCase()} />;
}
