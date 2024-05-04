function any(schema, options) {
  schema.statics.any = async function (query) {
    const result = await this.findOne(query).select("_id").lean();
    return result ? true : false;
  };
}1

module.exports = {
  any,
};
