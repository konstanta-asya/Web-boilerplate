import { randomUserMock, additionalUsers } from './FE4U-Lab2-mock.js';

const COURSES = [
  'Mathematics',
  'Physics',
  'English',
  'Computer Science',
  'Dancing',
  'Chess',
  'Biology',
  'Chemistry',
  'Law',
  'Art',
  'Medicine',
  'Statistics',
];

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getRandomColor() {
  const hex = Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0');
  return `#${hex}`;
}

function generateId() {
  return Math.random().toString(36).slice(2, 12);
}

function getAge(birthDate) {
  if (!birthDate) {
    return null;
  }
  const ageInMs = Date.now() - new Date(birthDate).getTime();
  return Math.floor(ageInMs / (365.25 * 24 * 60 * 60 * 1000));
}

function removeEmptyFields(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== null && value !== undefined),
  );
}

function formatRandomUser(user) {
  return {
    gender: user.gender,
    title: user.name.title,
    full_name: `${user.name.first} ${user.name.last}`,
    city: user.location.city,
    state: user.location.state,
    country: user.location.country,
    postcode: user.location.postcode,
    coordinates: user.location.coordinates,
    timezone: user.location.timezone,
    email: user.email,
    b_day: user.dob.date,
    age: user.dob.age,
    phone: user.phone,
    picture_large: user.picture.large,
    picture_thumbnail: user.picture.thumbnail,
    id: user.id.value ? `${user.id.name}${user.id.value}` : null,
  };
}

function addExtraFields(user) {
  return {
    ...user,
    id: user.id || generateId(),
    favorite: user.favorite || false,
    course: user.course || getRandomItem(COURSES),
    bg_color: user.bg_color || getRandomColor(),
    note: user.note || '',
    age: user.age || getAge(user.b_day),
  };
}

function getFormattedUsers(mainUsers = randomUserMock, extraUsers = additionalUsers) {
  const usersByName = new Map();

  mainUsers
    .map(formatRandomUser)
    .forEach((user) => usersByName.set(user.full_name, user));

  extraUsers.forEach((user) => {
    const existingUser = usersByName.get(user.full_name) || {};
    usersByName.set(user.full_name, { ...existingUser, ...removeEmptyFields(user) });
  });

  return [...usersByName.values()].map(addExtraFields);
}

const PHONE_FORMATS = {
  Germany: /^\d{4}-\d{7}$/,
  Ireland: /^\d{3}-\d{3}-\d{4}$/,
  Australia: /^\d{2}-\d{4}-\d{4}$/,
  'United States': /^\(\d{3}\)-\d{3}-\d{4}$/,
  Finland: /^\d{2}-\d{3}-\d{3}$/,
  Turkey: /^\(\d{3}\)-\d{3}-\d{4}$/,
  Switzerland: /^\d{3} \d{3} \d{2} \d{2}$/,
  'New Zealand': /^\(\d{3}\)-\d{3}-\d{4}$/,
  Spain: /^\d{3}-\d{3}-\d{3}$/,
  Norway: /^\d{8}$/,
  Denmark: /^\d{8}$/,
  Iran: /^\d{3}-\d{8}$/,
  Canada: /^\d{3}-\d{3}-\d{4}$/,
  France: /^\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/,
  Netherlands: /^\(\d{3}\)-\d{3}-\d{4}$/,
};

const DEFAULT_PHONE_FORMAT = /^[\d\s()+-]{7,}$/;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CAPITALIZED_FIELDS = ['full_name', 'gender', 'state', 'city', 'country'];

function isCapitalizedString(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }
  const firstChar = value.charAt(0);
  return /\p{L}/u.test(firstChar) && firstChar === firstChar.toUpperCase();
}

function isValidPhone(phone, country) {
  const format = PHONE_FORMATS[country] || DEFAULT_PHONE_FORMAT;
  return typeof phone === 'string' && format.test(phone);
}

function validateUser(user) {
  const errors = CAPITALIZED_FIELDS.filter((field) => !isCapitalizedString(user[field]));

  if (user.note && !isCapitalizedString(user.note)) {
    errors.push('note');
  }
  if (typeof user.age !== 'number' || Number.isNaN(user.age)) {
    errors.push('age');
  }
  if (!isValidPhone(user.phone, user.country)) {
    errors.push('phone');
  }
  if (typeof user.email !== 'string' || !EMAIL_FORMAT.test(user.email)) {
    errors.push('email');
  }

  return { isValid: errors.length === 0, errors };
}


function matchesAge(age, ageFilter) {
  if (typeof ageFilter === 'number') {
    return age === ageFilter;
  }
  const { min = 0, max = Infinity } = ageFilter;
  return age >= min && age <= max;
}

function filterUsers(users, filters = {}) {
  const {
    country, age, gender, favorite,
  } = filters;

  return users.filter((user) => (country === undefined || user.country === country)
    && (gender === undefined || user.gender === gender)
    && (favorite === undefined || user.favorite === favorite)
    && (age === undefined || matchesAge(user.age, age)));
}


const SORTABLE_FIELDS = ['full_name', 'age', 'b_day', 'country'];

function compareValues(a, b, field) {
  if (field === 'b_day') {
    return new Date(a) - new Date(b);
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b));
}

function sortUsers(users, field = 'full_name', order = 'asc') {
  if (!SORTABLE_FIELDS.includes(field)) {
    return [...users];
  }
  const direction = order === 'desc' ? -1 : 1;

  return [...users].sort((userA, userB) => {
    const a = userA[field];
    const b = userB[field];
    if (a === undefined || a === null) return 1;
    if (b === undefined || b === null) return -1;
    return compareValues(a, b, field) * direction;
  });
}


function matchesSearch(user, query) {
  if (typeof query === 'number') {
    return user.age === query;
  }
  const text = String(query).toLowerCase();
  return [user.full_name, user.note]
    .some((value) => typeof value === 'string' && value.toLowerCase().includes(text));
}

function findUser(users, query) {
  return users.find((user) => matchesSearch(user, query)) || null;
}

function getMatchPercentage(users, condition) {
  if (users.length === 0) {
    return 0;
  }
  const isMatch = typeof condition === 'function'
    ? condition
    : (user) => matchesSearch(user, condition);
  const matchedCount = users.filter(isMatch).length;

  return Math.round((matchedCount / users.length) * 10000) / 100;
}

export {
  getFormattedUsers,
  validateUser,
  filterUsers,
  sortUsers,
  findUser,
  getMatchPercentage,
};
