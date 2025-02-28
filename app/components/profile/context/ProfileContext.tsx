  professionalRecognitions: result.data.professionalRecognitions?.map(rec => ({
    ulid: rec.ulid,
    title: rec.title,
    type: rec.type,
    issueDate: rec.issueDate,
    issuer: rec.issuer,
    description: rec.description ?? null,
    isVisible: rec.isVisible,
    industryType: rec.industryType ?? null,
    status: rec.status ?? 'ACTIVE',
    expiryDate: rec.expiryDate ?? null,
    verificationUrl: rec.verificationUrl ?? null,
    certificateUrl: rec.certificateUrl ?? null,
    coachProfileUlid: rec.coachProfileUlid ?? null,
    userUlid: rec.userUlid,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt
  })) || [] 