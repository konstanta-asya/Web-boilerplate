import {
  COURSES,
  mergeObjects,
  getFormattedUsers,
  createUser,
  validateUser,
  filterUsers,
  sortUsers,
  searchUsers,
// eslint-disable-next-line import/extensions
} from './users.js';

const state = {
  teachers: getFormattedUsers(),
  filters: {},
  onlyWithPhoto: false,
  searchQuery: '',
  sort: { field: 'full_name', order: 'asc' },
  currentTeacherId: null,
};

const teachersGrid = document.querySelector('.teachers-grid');
const statisticsTable = document.querySelector('.statistics-table');
const statisticsBody = statisticsTable.querySelector('tbody');
const favoritesList = document.querySelector('.favorites-list');
const filtersForm = document.querySelector('.filters');
const searchForm = document.querySelector('.search');
const searchInput = document.querySelector('#search-input');
const infoPopup = document.querySelector('#teacher-info-popup');
const addPopup = document.querySelector('#add-teacher-popup');
const addForm = document.querySelector('.add-teacher-form');
const formError = addForm.querySelector('.form-error');

function escapeHtml(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getInitials(fullName) {
  return fullName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('.');
}

function findTeacherById(id) {
  return state.teachers.find((teacher) => teacher.id === id);
}

function getCountries() {
  return [...new Set(state.teachers.map((teacher) => teacher.country))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function fillSelect(select, values) {
  const options = values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join('');
  select.insertAdjacentHTML('beforeend', options);
}

function createAvatarHtml(teacher) {
  if (teacher.picture_large) {
    return `<img src="${escapeHtml(teacher.picture_large)}" alt="${escapeHtml(teacher.full_name)}">`;
  }
  return `<div class="teacher-initials">${escapeHtml(getInitials(teacher.full_name))}</div>`;
}

function createTeacherCard(teacher, showCourse = true) {
  const favoriteClass = teacher.favorite ? ' favorite' : '';
  const courseHtml = showCourse ? `<p class="subject">${escapeHtml(teacher.course)}</p>` : '';

  return `
    <div class="teacher-profile${favoriteClass}" data-id="${escapeHtml(teacher.id)}">
      ${createAvatarHtml(teacher)}
      <p class="name">${escapeHtml(teacher.full_name)}</p>
      ${courseHtml}
      <p class="country">${escapeHtml(teacher.country)}</p>
    </div>
  `;
}

function getVisibleTeachers() {
  let teachers = filterUsers(state.teachers, state.filters);

  if (state.onlyWithPhoto) {
    teachers = teachers.filter((teacher) => teacher.picture_large);
  }
  if (state.searchQuery !== '') {
    teachers = searchUsers(teachers, state.searchQuery);
  }
  return teachers;
}

function renderTeachers() {
  const teachers = getVisibleTeachers();

  teachersGrid.innerHTML = teachers.length > 0
    ? teachers.map((teacher) => createTeacherCard(teacher)).join('')
    : '<p class="empty-message">No teachers found</p>';
}

function renderFavorites() {
  const favorites = state.teachers.filter((teacher) => teacher.favorite);

  favoritesList.innerHTML = favorites.length > 0
    ? favorites.map((teacher) => createTeacherCard(teacher, false)).join('')
    : '<p class="empty-message">No favorite teachers yet</p>';
}

function createTableRow(teacher) {
  return `
    <tr>
      <td>${escapeHtml(teacher.full_name)}</td>
      <td>${escapeHtml(teacher.course)}</td>
      <td>${escapeHtml(teacher.age)}</td>
      <td>${escapeHtml(teacher.gender)}</td>
      <td>${escapeHtml(teacher.country)}</td>
    </tr>
  `;
}

function renderStatistics() {
  const { field, order } = state.sort;
  const sortedTeachers = sortUsers(state.teachers, field, order);

  statisticsBody.innerHTML = sortedTeachers.map(createTableRow).join('');

  statisticsTable.querySelectorAll('th[data-sort]').forEach((header) => {
    const isActive = header.dataset.sort === field;
    header.classList.toggle('is-sorted', isActive);
    header.classList.toggle('is-desc', isActive && order === 'desc');
  });
}

function handleSortClick(event) {
  const header = event.target.closest('th[data-sort]');
  if (!header) {
    return;
  }
  const { field, order } = state.sort;
  const newField = header.dataset.sort;
  const newOrder = field === newField && order === 'asc' ? 'desc' : 'asc';

  state.sort = { field: newField, order: newOrder };
  renderStatistics();
}

function renderAll() {
  renderTeachers();
  renderStatistics();
  renderFavorites();
}

function openPopup(popup) {
  popup.classList.add('is-open');
}

function closePopup(popup) {
  popup.classList.remove('is-open');
}

function fillTeacherInfo(teacher) {
  const photo = infoPopup.querySelector('.teacher-info-photo');
  const email = infoPopup.querySelector('.teacher-info-email');
  const phone = infoPopup.querySelector('.teacher-info-phone');
  const star = infoPopup.querySelector('.favorite-star');

  photo.hidden = !teacher.picture_large;
  photo.src = teacher.picture_large || '';
  photo.alt = teacher.full_name;

  infoPopup.querySelector('.teacher-info-name').textContent = teacher.full_name;
  infoPopup.querySelector('.teacher-info-subject').textContent = teacher.course;
  infoPopup.querySelector('.teacher-info-location').textContent = [teacher.city, teacher.country]
    .filter(Boolean)
    .join(', ');
  infoPopup.querySelector('.teacher-info-age').textContent = `${teacher.age}, ${teacher.gender}`;
  infoPopup.querySelector('.teacher-info-note').textContent = teacher.note;

  email.textContent = teacher.email || '';
  email.href = teacher.email ? `mailto:${teacher.email}` : '';
  phone.textContent = teacher.phone || '';
  phone.href = teacher.phone ? `tel:${teacher.phone.replace(/[^\d+]/g, '')}` : '';

  star.textContent = teacher.favorite ? '\u2605' : '\u2606';
  star.setAttribute('aria-pressed', String(teacher.favorite));
}

function showTeacherInfo(id) {
  const teacher = findTeacherById(id);
  if (!teacher) {
    return;
  }
  state.currentTeacherId = id;
  fillTeacherInfo(teacher);
  openPopup(infoPopup);
}

function handleCardClick(event) {
  const card = event.target.closest('.teacher-profile');
  if (card) {
    showTeacherInfo(card.dataset.id);
  }
}

function toggleFavorite() {
  const id = state.currentTeacherId;

  state.teachers = state.teachers.map((teacher) => (
    teacher.id === id ? mergeObjects(teacher, { favorite: !teacher.favorite }) : teacher
  ));
  fillTeacherInfo(findTeacherById(id));
  renderTeachers();
  renderFavorites();
}

function scrollFavorites(direction) {
  favoritesList.scrollBy({ left: direction * favoritesList.clientWidth, behavior: 'smooth' });
}

function getAgeFilter(value) {
  if (value === 'all') {
    return undefined;
  }
  const [min, max] = value.split('-').map(Number);
  return { min, max };
}

function handleFiltersChange() {
  const { elements } = filtersForm;
  const country = elements.country.value;
  const gender = elements.sex.value;

  state.filters = {
    age: getAgeFilter(elements.age.value),
    country: country === 'all' ? undefined : country,
    gender: gender === 'all' ? undefined : gender,
    favorite: elements['only-favorites'].checked ? true : undefined,
  };
  state.onlyWithPhoto = elements['only-photo'].checked;
  renderTeachers();
}

function handleSearch(event) {
  event.preventDefault();
  const query = searchInput.value.trim();

  state.searchQuery = /^\d+$/.test(query) ? Number(query) : query;
  renderTeachers();
  document.querySelector('#teachers').scrollIntoView({ behavior: 'smooth' });
}

function handleSearchInput() {
  if (searchInput.value.trim() === '') {
    state.searchQuery = '';
    renderTeachers();
  }
}

const ERROR_FIELDS = {
  full_name: 'teacher-name',
  city: 'teacher-city',
  country: 'teacher-country',
  email: 'teacher-email',
  phone: 'teacher-phone',
  age: 'teacher-birth',
  gender: 'teacher-sex',
  note: 'teacher-notes',
};

function getFormData() {
  const { elements } = addForm;
  const birthDate = elements['teacher-birth'].value;

  return {
    full_name: elements['teacher-name'].value.trim(),
    course: elements['teacher-speciality'].value,
    country: elements['teacher-country'].value,
    city: elements['teacher-city'].value.trim(),
    email: elements['teacher-email'].value.trim(),
    phone: elements['teacher-phone'].value.trim(),
    b_day: birthDate ? new Date(birthDate).toISOString() : null,
    gender: elements['teacher-sex'].value,
    bg_color: elements['teacher-color'].value,
    note: elements['teacher-notes'].value.trim(),
  };
}

function showFormErrors(errors) {
  addForm.querySelectorAll('.is-invalid').forEach((element) => {
    element.classList.remove('is-invalid');
  });

  errors.forEach((field) => {
    const element = addForm.querySelector(`#${ERROR_FIELDS[field]}`);
    if (element) {
      element.classList.add('is-invalid');
    }
  });

  formError.hidden = errors.length === 0;
  formError.textContent = errors.length > 0
    ? 'Please check the highlighted fields: names start with a capital letter, email has @, date of birth is required.'
    : '';
}

function handleAddTeacher(event) {
  event.preventDefault();
  const teacher = createUser(getFormData());
  const errors = validateUser(teacher).errors.filter((field) => field !== 'state');

  showFormErrors(errors);
  if (errors.length > 0) {
    return;
  }

  state.teachers = [teacher, ...state.teachers];
  renderAll();
  addForm.reset();
  closePopup(addPopup);
}

function initEvents() {
  teachersGrid.addEventListener('click', handleCardClick);
  favoritesList.addEventListener('click', handleCardClick);
  infoPopup.querySelector('.favorite-star').addEventListener('click', toggleFavorite);
  statisticsTable.querySelector('thead').addEventListener('click', handleSortClick);
  filtersForm.addEventListener('change', handleFiltersChange);
  searchForm.addEventListener('submit', handleSearch);
  searchInput.addEventListener('input', handleSearchInput);
  addForm.addEventListener('submit', handleAddTeacher);

  document.querySelector('.arrow-prev').addEventListener('click', () => scrollFavorites(-1));
  document.querySelector('.arrow-next').addEventListener('click', () => scrollFavorites(1));

  document.querySelectorAll('.open-add-teacher').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openPopup(addPopup);
    });
  });

  document.querySelectorAll('.popup-close').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      closePopup(event.currentTarget.closest('.popup-overlay'));
    });
  });

  document.querySelectorAll('.popup-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) {
        closePopup(overlay);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.popup-overlay.is-open').forEach(closePopup);
    }
  });
}

function init() {
  fillSelect(filtersForm.elements.country, getCountries());
  fillSelect(addForm.elements['teacher-speciality'], COURSES);
  fillSelect(addForm.elements['teacher-country'], [...new Set(['Ukraine', ...getCountries()])]);
  renderAll();
  initEvents();
}

init();
