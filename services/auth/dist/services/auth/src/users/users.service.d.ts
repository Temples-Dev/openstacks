import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, updateData: Partial<User>): Promise<User>;
    remove(id: string): Promise<void>;
    activate(id: string): Promise<User>;
    deactivate(id: string): Promise<User>;
}
