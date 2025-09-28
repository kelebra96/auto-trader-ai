const { User, Permission, UserPermission } = require("./src/models");

async function inspect(email) {
  if (!email) {
    console.error("Usage: node tmp-inspect-user.js <email>");
    process.exit(2);
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }

  console.log(`Inspecting UserPermissions for ${email} (id=${user.id})`);
  const ups = await UserPermission.findAll({
    where: { user_id: user.id },
    include: [Permission],
  });
  if (!ups || ups.length === 0) {
    console.log("No UserPermission rows found for user");
    return process.exit(0);
  }

  ups.forEach((row) => {
    console.log(
      `- permission_id=${row.permission_id} granted=${row.granted} createdAt=${row.createdAt}` +
        (row.Permission ? ` name=${row.Permission.name}` : "")
    );
  });
}

inspect(process.argv[2])
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
