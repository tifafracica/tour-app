class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('name');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIFeatures;

//1. CREAMOS LA QUERY

    //FILTRADO
    // {...} extender sobre el objeto y obtener
    //todas sus propiedades, luego sobrescribir
    //las propiedades existentes con las que estamos pasando.
    // const queryObj = { ...req.query };

    // aca retiramos los elementos que capaz
    // estamos pidiendo pero que no estan en el objeto.
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach(el => delete queryObj[el]);

    // FILTRADO AVANZADO
    // convertimos la query en string con JSON.stringify
    // let queryString = JSON.stringify(queryObj);

    // creamos un RegEx para agregarle el
    // signo $ a los gte, gt, lte, lt (string EXACTOS)
    // ya que viene como string en la query.
    // queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    // let query = Tour.find(JSON.parse(queryString));


    // SORTING
    // if (req.query.sort) {
    // quitamos las comas y agregamos un espacio en blanco
    // ya que en mongo db cuando quieres hacer sort
    // por varias propiedades es sort(propiedad1 propiedad2)
    // const sortBy = req.query.sort.split(',').join(' ');
    //   query = query.sort(sortBy);
    // } else {
    // seteamos una organizacion default que seria
    // el ultimo creado.
    //   query = query.sort('name');
    // }
    // LIMITANDO FIELDS

    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v');
    // }

    // PAGINACIÓN
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;

    // query = query.skip(skip).limit(limit);
    // console.log(skip)

    // cuando la pagina no existe.

    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error('This pages does not exist');
    // }

    // writting a query like mongodbd
    // const query = await Tour.find({
    //   duration: 5,
    //   difficulty: 'easy',
    // })

    //writting a query like mongoose methods.
    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');