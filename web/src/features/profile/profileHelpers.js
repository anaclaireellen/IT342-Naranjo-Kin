import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/auth';
export const PROFILE_UPDATED_EVENT = 'profile-updated';
const PROFILE_DIRECTORY_KEY = 'profileDirectory';
const CURRENT_PROFILE_KEY = 'currentProfile';

const formatNamePart = (value) => {
  if (!value) return '';

  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const buildDisplayName = (firstName, lastName, fallbackUserName = 'User') => {
  const fullName = [formatNamePart(firstName), formatNamePart(lastName)].filter(Boolean).join(' ').trim();
  return fullName || formatNamePart(fallbackUserName) || fallbackUserName;
};

const readProfileDirectory = () => {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_DIRECTORY_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeProfileDirectory = (directory) => {
  localStorage.setItem(PROFILE_DIRECTORY_KEY, JSON.stringify(directory));
};

const mergeProfilesIntoDirectory = (profiles) => {
  if (!profiles || profiles.length === 0) return;

  const directory = readProfileDirectory();
  profiles.forEach((profile) => {
    if (!profile?.username) return;

    directory[profile.username] = {
      username: profile.username,
      firstName: profile.firstName || directory[profile.username]?.firstName || '',
      lastName: profile.lastName || directory[profile.username]?.lastName || '',
      profilePic: profile.profilePic || directory[profile.username]?.profilePic || '',
      role: profile.role || directory[profile.username]?.role || '',
      email: directory[profile.username]?.email || '',
    };
  });
  writeProfileDirectory(directory);
};

export const getProfileDirectory = () => readProfileDirectory();

export const getCachedProfileByUsername = (username) => {
  if (!username) return null;
  return readProfileDirectory()[username] || null;
};

const readCurrentProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_PROFILE_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeCurrentProfile = (profile) => {
  localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(profile));
};

export const clearStoredSession = () => {
  localStorage.removeItem('isAuth');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  localStorage.removeItem(CURRENT_PROFILE_KEY);
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
};

export const getStoredProfile = () => ({
  ...(() => {
    const currentProfile = readCurrentProfile();
    const directory = readProfileDirectory();
    const fallbackUserName = currentProfile.userName || localStorage.getItem('userName') || 'User';
    const directoryProfile = directory[fallbackUserName] || {};

    return {
      userName: fallbackUserName,
      firstName: formatNamePart(currentProfile.firstName || directoryProfile.firstName || ''),
      lastName: formatNamePart(currentProfile.lastName || directoryProfile.lastName || ''),
      greetingName: formatNamePart(currentProfile.firstName || directoryProfile.firstName || fallbackUserName),
      displayName: buildDisplayName(
        currentProfile.firstName || directoryProfile.firstName || '',
        currentProfile.lastName || directoryProfile.lastName || '',
        fallbackUserName
      ),
      userEmail: currentProfile.userEmail || localStorage.getItem('userEmail') || directoryProfile.email || '',
      userRole: currentProfile.userRole || localStorage.getItem('userRole') || directoryProfile.role || 'Student',
      profilePic: currentProfile.profilePic || directoryProfile.profilePic || '',
    };
  })(),
});

export const persistProfile = ({ userName, firstName, lastName, userEmail, userRole, profilePic }) => {
  if (typeof userName === 'string') localStorage.setItem('userName', userName);
  if (typeof userEmail === 'string') localStorage.setItem('userEmail', userEmail);
  if (typeof userRole === 'string') localStorage.setItem('userRole', userRole);

  const existingDirectoryProfile = userName ? readProfileDirectory()[userName] || {} : {};
  const resolvedProfilePic = typeof profilePic === 'string' && profilePic.trim()
    ? profilePic
    : existingDirectoryProfile.profilePic || '';

  if (typeof userName === 'string' && userName) {
    const directory = readProfileDirectory();
    directory[userName] = {
      username: userName,
      firstName: typeof firstName === 'string' ? firstName : directory[userName]?.firstName || '',
      lastName: typeof lastName === 'string' ? lastName : directory[userName]?.lastName || '',
      profilePic: resolvedProfilePic,
      role: typeof userRole === 'string' ? userRole : directory[userName]?.role || '',
      email: typeof userEmail === 'string' ? userEmail : directory[userName]?.email || '',
    };
    writeProfileDirectory(directory);
  }

  writeCurrentProfile({
    userName: typeof userName === 'string' ? userName : localStorage.getItem('userName') || 'User',
    firstName: typeof firstName === 'string' ? firstName : existingDirectoryProfile.firstName || '',
    lastName: typeof lastName === 'string' ? lastName : existingDirectoryProfile.lastName || '',
    userEmail: typeof userEmail === 'string' ? userEmail : localStorage.getItem('userEmail') || '',
    userRole: typeof userRole === 'string' ? userRole : localStorage.getItem('userRole') || 'Student',
    profilePic: resolvedProfilePic,
  });

  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
};

export const fetchProfilesByUsernames = async (usernames) => {
  const unique = [...new Set((usernames || []).filter(Boolean))];
  if (unique.length === 0) return {};

  const localProfiles = readProfileDirectory();
  let remoteProfiles = {};

  try {
    const response = await axios.get(`${API_BASE}/profiles`, {
      params: { usernames: unique },
      paramsSerializer: {
        serialize: (params) =>
          params.usernames.map((username) => `usernames=${encodeURIComponent(username)}`).join('&'),
      },
    });

    remoteProfiles = (response.data || []).reduce((acc, profile) => {
      acc[profile.username] = profile;
      return acc;
    }, {});
    mergeProfilesIntoDirectory(response.data || []);
  } catch (error) {
    console.error('Profile lookup failed, using local cache', error);
  }

  return unique.reduce((acc, username) => {
    acc[username] = {
      username,
      firstName: remoteProfiles[username]?.firstName || localProfiles[username]?.firstName || '',
      lastName: remoteProfiles[username]?.lastName || localProfiles[username]?.lastName || '',
      profilePic: remoteProfiles[username]?.profilePic || localProfiles[username]?.profilePic || '',
      role: remoteProfiles[username]?.role || localProfiles[username]?.role || '',
    };
    return acc;
  }, {});
};
