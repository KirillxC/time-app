async function fetchEvents() {
  const [staticEvents, userEvents] = await Promise.all([
      fetch('/api/events').then(res => res.json()),
      fetch('/api/user-events').then(res => res.json())
  ]);
  return { staticEvents, userEvents };
}

function formatTimeDiff(date, isPast) {
  const now = new Date();
  let target;

  if (date === "summerStart") {
      target = new Date(now.getFullYear(), 5, 1, 0, 0, 0); 
      target = new Date(date); 
  }

  let diffMs = isPast ? now - target : target - now;

  const oneDay = 1000 * 60 * 60 * 24;
  const oneHour = 1000 * 60 * 60;
  const oneMinute = 1000 * 60;
  const oneSecond = 1000;

  if (diffMs < oneDay * 365) {
      const days = Math.floor(diffMs / oneDay);
      diffMs -= days * oneDay;

      const hours = Math.floor(diffMs / oneHour);
      diffMs -= hours * oneHour;

      const minutes = Math.floor(diffMs / oneMinute);
      diffMs -= minutes * oneMinute;

      const seconds = Math.floor(diffMs / oneSecond);

      return (isPast ? `Прошло: ` : `Осталось: `) +
          `${days} д. ${hours} ч. ${minutes} мин. ${seconds} сек.`;
  } else {

      const years = Math.floor(diffMs / (oneDay * 365));
      diffMs -= years * (oneDay * 365);

      const months = Math.floor(diffMs / (oneDay * 30));
      diffMs -= months * (oneDay * 30);

      const days = Math.floor(diffMs / oneDay);

      return (isPast ? `Прошло: ` : `Осталось: `) + `${years} г., ${months} мес., ${days} дн.`;
  }
}

function createEventCard(event, isPast = false) {
  const card = document.createElement('div');
  card.className = 'event';

  const title = document.createElement('h3');
  title.textContent = event.title;

  const timeInfo = document.createElement('p');

  function updateTimer() {
      timeInfo.textContent = formatTimeDiff(event.date, isPast);
  }

  updateTimer();
  if (!isPast) {
      setInterval(updateTimer, 1000);
  }

  card.appendChild(title);
  card.appendChild(timeInfo);

  return card;
}

async function renderEvents() {
  const { staticEvents, userEvents } = await fetchEvents();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcoming = document.getElementById('upcoming-events');
  const past = document.getElementById('past-events');
  const birthdays = document.getElementById('birthday-events');
  const userList = document.getElementById('user-events-list');

  upcoming.innerHTML = '';
  past.innerHTML = '';
  birthdays.innerHTML = '';
  userList.innerHTML = '';

  staticEvents.forEach(event => {
      const isPast = new Date(event.date) < now;
      const card = createEventCard(event, isPast);
      (isPast ? past : upcoming).appendChild(card);
  });

  userEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const isPast = eventDate < now;
      const isToday = eventDate.getFullYear() === today.getFullYear() &&
                      eventDate.getMonth() === today.getMonth() &&
                      eventDate.getDate() === today.getDate();
      const card = createEventCard(event, isPast);
      const display = event.display || 'default'; 

      if (display === 'birthday') {
          birthdays.appendChild(card);
      } else if (display === 'hidden' && isToday) {
          userList.appendChild(card);
      } else if (display === 'default') {
          userList.appendChild(card);
      }
  });
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
      page.classList.add('hidden');
  });
  document.getElementById(pageId).classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.nav-btn[data-page="${pageId}"]`).classList.add('active');
}

document.getElementById('event-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const date = document.getElementById('date').value;
  const display = document.getElementById('display').value;

  if (!title || !date || !display) return;

  await fetch('/api/user-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, display })
  });

  e.target.reset();
  renderEvents();
});

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

renderEvents();
showPage('will-be');

const worldOpenCodeBtn = document.getElementById('worldopencode-btn');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal');

worldOpenCodeBtn.addEventListener('click', () => {
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden'; 
});

closeModalBtn.addEventListener('click', () => {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
});

document.addEventListener('DOMContentLoaded', () => {
});
