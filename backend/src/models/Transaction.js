const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'Transaction',
  tableName: 'transactions',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    senderId: { type: 'int', nullable: true },
    receiverId: { type: 'int', nullable: true },
    amount: { type: 'decimal' },
    type: { type: 'varchar' },
    status: { type: 'varchar', default: 'success' },
    paymentMethod: { type: 'varchar', nullable: true },
    paymentRef: { type: 'varchar', nullable: true },
    description: { type: 'varchar', nullable: true },
    createdAt: { type: 'timestamp', createDate: true }
  }
})