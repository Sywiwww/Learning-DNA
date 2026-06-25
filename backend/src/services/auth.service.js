const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");
const { generateToken } = require("../utils/jwt");

const registerUser = async (email, password) => {
  // Check if user already exists
  const { data: existingUser, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    throw new Error(existingError.message);
  }

  if (existingUser) {
    throw new Error("Email is already registered.");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        email,
        password: hashedPassword,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const loginUser = async (email, password) => {
  // Find user
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) {
    throw new Error("Invalid email or password.");
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password.");
  }

  // Generate JWT
  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  };
};

module.exports = {
  registerUser,
  loginUser,
};