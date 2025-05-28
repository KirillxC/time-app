async function getEventData() {
  const [baseEvents, customEvents] = await Promise.all([
    fetch('/api/events').then(r => r.json()),
    fetch('/api/user-events').then(r => r.json())
  ]);
  return {baseEvents, customEvents};
}

function showTimeRemaining(eventDate, isPastEvent) {
  const now = new Date();
  const target = new Date(eventDate);
  
  if (isNaN(target)) return "Некорректная дата";

  let diff = isPastEvent ? now - target : target - now;
  if (diff < 0 && !isPastEvent) return "Событие прошло";

  const sec = 1000, min = sec * 60, hour = min * 60, day = hour * 24;
  const month = day * 30, year = day * 365;

  const years = Math.floor(diff / year);
  diff -= years * year;
  const months = Math.floor(diff / month);
  diff -= months * month;
  const days = Math.floor(diff / day);

  const parts = [];
  if (years > 0) parts.push(`${years} г.`);
  if (months > 0) parts.push(`${months} мес.`);
  if (days > 0) parts.push(`${days} дн.`);

  if (parts.length === 0) {
    diff = isPastEvent ? now - target : target - now;
    const hours = Math.floor(diff / hour);
    diff -= hours * hour;
    const minutes = Math.floor(diff / min);
    diff -= minutes * min;
    const seconds = Math.floor(diff / sec);
    return `${isPastEvent ? 'Прошло:' : 'Осталось:'} ${hours} ч. ${minutes} мин. ${seconds} сек.`;
  }

  return `${isPastEvent ? 'Прошло:' : 'Осталось:'} ${parts.join(' ')}`;
}

function makeEventCard(event, isPast) {
  const card = document.createElement('div');
  card.className = 'event';

  const title = document.createElement('h3');
  title.textContent = event.title;

  const time = document.createElement('p');
  
  function updateTime() {
    time.textContent = showTimeRemaining(event.date, isPast);
  }

  updateTime();
  if (!isPast) {
    setInterval(updateTime, 1000);
  }

  card.append(title, time);
  return card;
}

async function displayEvents() {
  const {baseEvents, customEvents} = await getEventData();
  const currentDate = new Date();
  
  const sections = {
    upcoming: document.getElementById('upcoming-events'),
    past: document.getElementById('past-events'),
    birthdays: document.getElementById('birthday-events'),
    custom: document.getElementById('user-events-list')
  };

  Object.values(sections).forEach(el => el.innerHTML = '');

  baseEvents.forEach(event => {
    const isPast = new Date(event.date) < currentDate;
    sections[isPast ? 'past' : 'upcoming'].append(makeEventCard(event, isPast));
  });

  customEvents.forEach(event => {
    const eventDate = new Date(event.date);
    const isPast = eventDate < currentDate;
    const isToday = eventDate.toDateString() === currentDate.toDateString();
    
    const card = makeEventCard(event, isPast);
    if (event.display === 'birthday') {
      sections.birthdays.append(card);
    } else if (event.display === 'hidden' && isToday) {
      sections.custom.append(card);
    } else if (event.display === 'default') {
      sections.custom.append(card);
    }
  });
}

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.toggle('hidden', page.id !== pageId);
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });
}

document.getElementById('event-form').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  
  await fetch('/api/user-events', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      title: form.title.value.trim(),
      date: form.date.value,
      display: form.display.value
    })
  });

  form.reset();
  displayEvents();
});

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchPage(btn.dataset.page));
});

document.getElementById('worldopencode-btn').addEventListener('click', () => {
  const modal = document.getElementById('modal-overlay');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
});

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.remove('active');
  document.body.style.overflow = '';
});

displayEvents();
switchPage('will-be');
