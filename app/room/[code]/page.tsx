import Lobby from "./Lobby";

// Server component: sblocca i params (Promise in Next 15) e passa il codice
// al componente client che gestisce Realtime.
export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <Lobby code={code.toUpperCase()} />;
}
