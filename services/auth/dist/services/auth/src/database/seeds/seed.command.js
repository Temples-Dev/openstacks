"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
const seed_module_1 = require("./seed.module");
const seed_service_1 = require("./seed.service");
const user_entity_1 = require("../../users/entities/user.entity");
const role_entity_1 = require("../../roles/entities/role.entity");
const permission_entity_1 = require("../../roles/entities/permission.entity");
const session_entity_1 = require("../../auth/entities/session.entity");
let SeedAppModule = class SeedAppModule {
};
SeedAppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 5432),
                    username: configService.get('DB_USERNAME', 'shellnexa_app'),
                    password: configService.get('DB_PASSWORD', 'shellnexa_app_dev'),
                    database: configService.get('DB_DATABASE', 'auth_service'),
                    entities: [user_entity_1.User, role_entity_1.Role, permission_entity_1.Permission, session_entity_1.Session],
                    synchronize: true,
                    logging: false,
                }),
                inject: [config_1.ConfigService],
            }),
            seed_module_1.SeedModule,
        ],
    })
], SeedAppModule);
async function bootstrap() {
    const app = await core_1.NestFactory.create(SeedAppModule);
    const seedService = app.get(seed_service_1.SeedService);
    try {
        await seedService.seed();
        console.log('✅ Database seeding completed successfully');
    }
    catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=seed.command.js.map