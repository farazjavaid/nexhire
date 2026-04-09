export class CreateOrgDto {
  legalName: string;
  tradingName?: string;
  organisationType: string;
  industry?: string;
  countryCode?: string;
  timezone?: string;
  website?: string;
  description?: string;
  employeeRange?: string;
  logoUrl?: string;
}
