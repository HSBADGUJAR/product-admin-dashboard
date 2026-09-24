export const getAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("accessToken");
};

export const isAuthenticated = () => {
  return Boolean(getAccessToken());
};

export const saveAccessToken = (token) => {
  localStorage.setItem("accessToken", token);
};

export const logoutUser = () => {
  localStorage.removeItem("accessToken");
};