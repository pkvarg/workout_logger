migrate(
  (app) => {
    const exercises = app.findCollectionByNameOrId('exercises')
    exercises.fields.add(
      new Field({
        type: 'select',
        name: 'kind',
        required: false,
        maxSelect: 1,
        values: ['weight', 'bodyweight', 'reps', 'time'],
      }),
    )
    app.save(exercises)

    const sets = app.findCollectionByNameOrId('sets')
    sets.fields.add(
      new Field({
        type: 'number',
        name: 'duration',
        required: false,
      }),
    )
    app.save(sets)
  },
  (app) => {
    const exercises = app.findCollectionByNameOrId('exercises')
    const kind = exercises.fields.getByName('kind')
    if (kind) {
      exercises.fields.removeById(kind.id)
      app.save(exercises)
    }
    const sets = app.findCollectionByNameOrId('sets')
    const duration = sets.fields.getByName('duration')
    if (duration) {
      sets.fields.removeById(duration.id)
      app.save(sets)
    }
  },
)
