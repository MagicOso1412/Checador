import { useEffect, useState } from "react";

/** Reloj que se actualiza cada segundo, usado en las pantallas de kiosco/campo. */
export function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
