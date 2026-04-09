export class RegisterDto {
  email: string;
  password: string;
  name: string;
  role?: string; // candidate, client, interviewer, internal_employee
}
