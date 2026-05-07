const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    name: { type: 'varchar' },
    email: { type: 'varchar', unique: true },
    password: { type: 'varchar' },
    role: { type: 'varchar', default: 'user' },
    balance: { type: 'decimal', default: 0 },
    isActive: { type: 'boolean', default: true }
  }
})