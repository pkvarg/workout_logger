migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    users.createRule = ''
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'

    if (!users.fields.getByName('name')) {
      users.fields.add(new Field({ type: 'text', name: 'name', max: 120 }))
    }
    if (!users.fields.getByName('default_rate')) {
      users.fields.add(new Field({ type: 'number', name: 'default_rate' }))
    }
    if (!users.fields.getByName('currency')) {
      users.fields.add(new Field({ type: 'text', name: 'currency', max: 8 }))
    }
    if (!users.fields.getByName('monthly_goal')) {
      users.fields.add(new Field({ type: 'number', name: 'monthly_goal' }))
    }
    app.save(users)

    const ownRule = '@request.auth.id != "" && user = @request.auth.id'
    const sessions = new Collection({
      type: 'base',
      name: 'sessions',
      listRule: ownRule,
      viewRule: ownRule,
      createRule: ownRule,
      updateRule: ownRule,
      deleteRule: ownRule,
      fields: [
        {
          type: 'relation',
          name: 'user',
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
          collectionId: users.id,
        },
        { type: 'text', name: 'activity', required: true, max: 120 },
        { type: 'text', name: 'icon', max: 16 },
        { type: 'date', name: 'session_date', required: true },
        { type: 'number', name: 'hours', required: true },
        { type: 'number', name: 'rate', required: true },
      ],
      indexes: ['CREATE INDEX `idx_sessions_user_date` ON `sessions` (`user`, `session_date`)'],
    })
    app.save(sessions)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('sessions'))
    } catch (e) {}
    const users = app.findCollectionByNameOrId('users')
    ;['name', 'default_rate', 'currency', 'monthly_goal'].forEach((n) => {
      const f = users.fields.getByName(n)
      if (f) users.fields.removeById(f.id)
    })
    app.save(users)
  },
)
