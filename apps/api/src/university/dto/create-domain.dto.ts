import { IsString, Matches } from 'class-validator';

export class CreateApprovedDomainDto {
  @IsString()
  @Matches(/^[a-z0-9.-]+\.[a-z]{2,}$/i, { message: 'Must be a valid domain, e.g. university.edu' })
  domain: string;
}
