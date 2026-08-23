import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getPublicEstablishment } from "@/lib/loyalty/publicJoin";

describe("getPublicEstablishment", () => {
  let establishmentId: string;
  let establishmentName: string;

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
      include: { establishment: true },
    });
    establishmentId = a.establishmentId;
    establishmentName = a.establishment.name;
  });

  it("returns the establishment's public name by id", async () => {
    const result = await getPublicEstablishment(establishmentId);
    expect(result).toEqual({ id: establishmentId, name: establishmentName });
  });

  it("returns null for an id that doesn't exist", async () => {
    const result = await getPublicEstablishment("00000000-0000-0000-0000-000000000000");
    expect(result).toBeNull();
  });
});
