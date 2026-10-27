import {
  getFormattedUsers,
  validateUser,
  filterUsers,
  sortUsers,
  findUser,
  getMatchPercentage,
// eslint-disable-next-line import/extensions
} from './app.js';

const users = getFormattedUsers();

console.log('1. Кількість викладачів:', users.length);

console.log('2. Перевірка Norbert Weishaupt:', validateUser(users[0]));
console.log('   Перевірка Olivia Storm:', validateUser(users[users.length - 1]));

const filtered = filterUsers(users, { gender: 'male', age: { min: 30, max: 50 } });
console.log('3. Чоловіки 30-50 років:', filtered.map((user) => `${user.full_name} (${user.age})`));

const sortedByAge = sortUsers(users, 'age', 'desc');
console.log('4. Троє найстарших:', sortedByAge.slice(0, 3).map((user) => `${user.full_name} (${user.age})`));

console.log('5. Пошук "Norbert":', findUser(users, 'Norbert')?.full_name);
console.log('   Пошук за віком 65:', findUser(users, 65)?.full_name);

console.log('6. Відсоток старших за 30 років:', getMatchPercentage(users, (user) => user.age > 30));