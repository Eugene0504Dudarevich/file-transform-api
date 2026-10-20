export const USER_PROFILE_FIELDS = {
  self: ['id', 'email', 'photo'] as const,
  privileged: ['id', 'email', 'photo'] as const,
} as const;

export type UserProfileField = (typeof USER_PROFILE_FIELDS.self)[number];

export const filterUserProfile = (
  profile: {
    id: string;
    email: string;
    photoUrl: string | null;
  },
  allowedFields: readonly UserProfileField[],
) => {
  const result: Partial<Record<UserProfileField, string | null>> = {};

  for (const field of allowedFields) {
    switch (field) {
      case 'id':
        result.id = profile.id;
        break;
      case 'email':
        result.email = profile.email;
        break;
      case 'photo':
        result.photo = profile.photoUrl;
        break;
    }
  }

  return {
    id: result.id,
    email: result.email,
    photo: result.photo,
    fields: {},
  };
};
