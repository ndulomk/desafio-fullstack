#!/bin/bash
set -e

read -p "Nome do módulo (plural, ex: tasks): " MODULE_PLURAL
[[ -z "$MODULE_PLURAL" ]] && echo "Nome vazio." && exit 1

if   [[ $MODULE_PLURAL == *ies ]]; then MODULE_SINGULAR="${MODULE_PLURAL%ies}y"
elif [[ $MODULE_PLURAL == *s   ]]; then MODULE_SINGULAR="${MODULE_PLURAL%s}"
else MODULE_SINGULAR=$MODULE_PLURAL; fi

pascal() { echo "$1" | awk -F'[-_]' '{ for(i=1;i<=NF;i++) printf toupper(substr($i,1,1)) substr($i,2); print "" }'; }
PASCAL=$(pascal "$MODULE_SINGULAR")
PASCAL_PLURAL=$(pascal "$MODULE_PLURAL")

BASE="src/modules/$MODULE_PLURAL"
[[ -d "$BASE" ]] && echo "Já existe: $BASE" && exit 1

mkdir -p "$BASE"/{events,application/{services,dtos,ports},infrastructure/{persistence,http/controllers}}

cat > "$BASE/events/${MODULE_SINGULAR}.events.ts" <<EOF
export enum ${PASCAL}Events {
  CREATED = '${MODULE_PLURAL}.created',
  UPDATED = '${MODULE_PLURAL}.updated',
  DELETED = '${MODULE_PLURAL}.deleted',
}
EOF

cat > "$BASE/application/dtos/${MODULE_SINGULAR}.dto.ts" <<EOF
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class Create${PASCAL}Dto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class Update${PASCAL}Dto extends PartialType(Create${PASCAL}Dto) {}
EOF

cat > "$BASE/application/ports/${MODULE_SINGULAR}.port.ts" <<EOF
export abstract class ${PASCAL}Repository {
  abstract findAll(): Promise<unknown[]>;
  abstract findById(id: string): Promise<unknown | null>;
  abstract create(data: unknown): Promise<unknown>;
  abstract update(id: string, data: unknown): Promise<unknown>;
  abstract delete(id: string): Promise<void>;
}
EOF

cat > "$BASE/application/services/${MODULE_SINGULAR}.service.ts" <<EOF
import { Injectable } from '@nestjs/common';
import { ${PASCAL}Repository } from '../ports/${MODULE_SINGULAR}.port';

@Injectable()
export class ${PASCAL}Service {
  constructor(private readonly ${MODULE_SINGULAR}Repo: ${PASCAL}Repository) {}
}
EOF

cat > "$BASE/infrastructure/persistence/${MODULE_SINGULAR}.repository.ts" <<EOF
import { Injectable } from '@nestjs/common';
import { ${PASCAL}Repository } from '../../application/ports/${MODULE_SINGULAR}.port';

@Injectable()
export class Drizzle${PASCAL}Repository implements ${PASCAL}Repository {
  async findAll(): Promise<unknown[]> { return []; }
  async findById(_id: string): Promise<unknown | null> { return null; }
  async create(_data: unknown): Promise<unknown> { return {}; }
  async update(_id: string, _data: unknown): Promise<unknown> { return {}; }
  async delete(_id: string): Promise<void> {}
}
EOF

cat > "$BASE/infrastructure/http/controllers/${MODULE_SINGULAR}.controller.ts" <<EOF
import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ${PASCAL}Service } from '../../../application/services/${MODULE_SINGULAR}.service';
import { Create${PASCAL}Dto, Update${PASCAL}Dto } from '../../../application/dtos/${MODULE_SINGULAR}.dto';

@ApiTags('${MODULE_PLURAL}')
@ApiBearerAuth()
@Controller('${MODULE_PLURAL}')
export class ${PASCAL}Controller {
  constructor(private readonly ${MODULE_SINGULAR}Service: ${PASCAL}Service) {}

  @Get()    findAll()                                          { return this.${MODULE_SINGULAR}Service; }
  @Get(':id') findOne(@Param('id') id: string)                { return id; }
  @Post()   create(@Body() dto: Create${PASCAL}Dto)           { return dto; }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: Update${PASCAL}Dto) { return { id, ...dto }; }
  @Delete(':id') remove(@Param('id') id: string)              { return id; }
}
EOF

cat > "$BASE/${MODULE_PLURAL}.module.ts" <<EOF
import { Module } from '@nestjs/common';
import { ${PASCAL}Service } from './application/services/${MODULE_SINGULAR}.service';
import { ${PASCAL}Controller } from './infrastructure/http/controllers/${MODULE_SINGULAR}.controller';
import { Drizzle${PASCAL}Repository } from './infrastructure/persistence/${MODULE_SINGULAR}.repository';
import { ${PASCAL}Repository } from './application/ports/${MODULE_SINGULAR}.port';

@Module({
  controllers: [${PASCAL}Controller],
  providers: [
    ${PASCAL}Service,
    { provide: ${PASCAL}Repository, useClass: Drizzle${PASCAL}Repository },
  ],
  exports: [${PASCAL}Service],
})
export class ${PASCAL_PLURAL}Module {}
EOF

echo ""
echo "Módulo '$MODULE_PLURAL' criado em $BASE"
echo ""
tree "$BASE" 2>/dev/null || find "$BASE" -type f | sort
echo ""
echo "Adiciona ${PASCAL_PLURAL}Module ao AppModule:"
echo "    import { ${PASCAL_PLURAL}Module } from './modules/${MODULE_PLURAL}/${MODULE_PLURAL}.module';"