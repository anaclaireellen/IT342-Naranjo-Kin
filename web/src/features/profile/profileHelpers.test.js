import {
  clearStoredSession,
  getCachedProfileByUsername,
  getStoredProfile,
  persistProfile
} from './profileHelpers';

beforeEach(() => {
  localStorage.clear();
});

test('persists the current profile and directory cache', () => {
  persistProfile({
    userName: 'ana.naranjo',
    firstName: 'Ana',
    lastName: 'Naranjo',
    userEmail: 'ana.naranjo@cit.edu',
    userRole: 'STUDENT',
    profilePic: 'avatar-data'
  });

  expect(getStoredProfile()).toMatchObject({
    userName: 'ana.naranjo',
    displayName: 'Ana Naranjo',
    greetingName: 'Ana',
    userEmail: 'ana.naranjo@cit.edu',
    userRole: 'STUDENT',
    profilePic: 'avatar-data'
  });
  expect(getCachedProfileByUsername('ana.naranjo')).toMatchObject({
    firstName: 'Ana',
    lastName: 'Naranjo'
  });
});

test('clears local authentication session fields', () => {
  persistProfile({ userName: 'ana.naranjo', userRole: 'STUDENT' });
  localStorage.setItem('isAuth', 'true');

  clearStoredSession();

  expect(localStorage.getItem('isAuth')).toBeNull();
  expect(localStorage.getItem('userName')).toBeNull();
  expect(getStoredProfile().userName).toBe('User');
});
