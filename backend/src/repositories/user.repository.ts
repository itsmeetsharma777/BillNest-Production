import { UserModel } from "../models/user.model";

export async function findUserById(userId: string) {
  return UserModel.findById(userId);
}

export async function findUserByEmail(email: string) {
  return UserModel.findOne({ email });
}

export async function findUserByEmailWithPassword(email: string) {
  return UserModel.findOne({ email }).select("+passwordHash");
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: "shopkeeper" | "customer";
}) {
  return UserModel.create(data);
}

export async function updateUserById(
  userId: string,
  data: Partial<{
    name: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
    emailVerified: boolean;
  }>,
) {
  return UserModel.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: true },
  );
}