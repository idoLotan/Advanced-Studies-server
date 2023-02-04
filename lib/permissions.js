const permissions = [
  { id: 0, role: "user" },
  { id: 1, role: "admin" },
];

module.exports.getPermissionsList = (permissionId) => {
  const map = {};

  permissions.forEach((pr) => {
    if ((permissionId & pr.id) == pr.id) {
      map[pr.role] = true;
    }
  });

  return map;
};
