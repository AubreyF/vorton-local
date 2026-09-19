// Pure, bounded calculations. No browser, store, clock, or network dependencies.
export function wholeNumber(value: string, label: string, min: number, max: number) {
  const number = /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(number) || number < min || number > max)
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  return number;
}

export function roomShuffle(rooms: number, occupied: number, arrivals: number) {
  wholeNumber(String(rooms), 'Available rooms', 1, 500);
  wholeNumber(String(occupied), 'Occupied rooms', 0, rooms);
  wholeNumber(String(arrivals), 'Arriving guests', 0, 500);
  const required = occupied + arrivals;
  const shortage = Math.max(0, required - rooms);
  return {
    required, shortage, remaining: Math.max(0, rooms - required),
    moves: Array.from({length: arrivals ? occupied : 0}, (_, index) => ({from:index+1,to:index+1+arrivals})),
  };
}

export function breakfastSchedule(guests: number, seats: number, eating: number, reset: number, start: string) {
  wholeNumber(String(guests), 'Hungry guests', 0, 500);
  wholeNumber(String(seats), 'Seats', 1, 100);
  wholeNumber(String(eating), 'Minutes per sitting', 1, 120);
  wholeNumber(String(reset), 'Reset minutes', 0, 60);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)) throw new Error('Choose a valid start time.');
  const [hours, minutes] = start.split(':').map(Number);
  const beginning = hours*60+minutes;
  const count = Math.ceil(guests/seats);
  const sittings = Array.from({length:count}, (_, index) => ({
    guests: Math.min(seats,guests-index*seats),
    start: beginning+index*(eating+reset),
    end: beginning+index*(eating+reset)+eating,
  }));
  const duration = count ? count*eating+(count-1)*reset : 0;
  return {sittings, duration, finish: beginning+duration};
}

// Relative service clock, deliberately independent of time zones and DST.
export function serviceTime(minutes: number) {
  const day = Math.floor(minutes/1440);
  const clock = `${String(Math.floor(minutes/60)%24).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
  return day ? `${clock} (+${day} ${day===1?'day':'days'})` : clock;
}
