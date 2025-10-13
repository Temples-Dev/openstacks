import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("./entities/user.entity").User[]>;
    findOne(id: string): Promise<import("./entities/user.entity").User>;
    update(id: string, updateData: any): Promise<import("./entities/user.entity").User>;
    activate(id: string): Promise<import("./entities/user.entity").User>;
    deactivate(id: string): Promise<import("./entities/user.entity").User>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
