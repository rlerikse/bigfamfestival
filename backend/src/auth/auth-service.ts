import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/interfaces/user.interface';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create new user with default role
    const newUser = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      phone: registerDto.phone,
      role: Role.ATTENDEE, // Default role
      shareMyCampsite: false,
      shareMyLocation: false,
      ticketType: 'need-ticket', // Default ticket type until assigned
    });

    // Generate JWT
    const token = this.generateToken(newUser);

    // Return user data (excluding password) and token
    return {
      user: this.sanitizeUser(newUser),
      token,
    };
  }

  /**
   * Validate user credentials
   */
  async validateUser(loginDto: LoginDto): Promise<User> {
    const { email, password } = loginDto;
    
    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.comparePasswords(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  /**
   * Log in a user and return JWT token
   */
  async login(user: User) {
    const token = this.generateToken(user);
    
    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Generate JWT token for user
   */
  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    
    return this.jwtService.sign(payload);
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  private async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Remove sensitive information from user object
   */
  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}
