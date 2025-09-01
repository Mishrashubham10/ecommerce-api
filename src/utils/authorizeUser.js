export async function authorizeUser(req, res, next) {
  const userIdFromParams = req.params;
  const loggedInUser = req.user;

  if (!loggedInUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const isAdmin = loggedInUser.role === 'Admin';
  const isSelf = loggedInUser.id === userIdFromParams;

  if (isAdmin || isSelf) {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden: Access denied' });
}