module.exports = ({ manifest: { full: { packages } } }) => {
  const environmentState = process.env.PRODUCTION_STATE
  if (environmentState === 'production') {
    return
  }

  // force consumers to use web: 'yes' in non-production environments
  console.log(`Pre App Deploy - environment: ${environmentState} - setting web: 'yes'`)
  for (const key in packages) {
    if (Object.prototype.hasOwnProperty.call(packages, key)) {
      const action = packages[key]
      action.actions.consumer.web = 'yes'
    }
  }
}
