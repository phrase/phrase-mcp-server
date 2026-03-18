import { z } from "zod";

export const projectStatusSchema = z.enum([
  "NEW",
  "ASSIGNED",
  "COMPLETED",
  "ACCEPTED_BY_VENDOR",
  "DECLINED_BY_VENDOR",
  "COMPLETED_BY_VENDOR",
  "CANCELLED",
]);

export const jobStatusSchema = z.enum([
  "NEW",
  "ACCEPTED",
  "DECLINED",
  "REJECTED",
  "DELIVERED",
  "EMAILED",
  "COMPLETED",
  "CANCELLED",
]);
