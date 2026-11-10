// Imports the server.js file to be tested.
const server = require("../server");
// Assertion (Test Driven Development) and Should,  Expect(Behaviour driven 
// development) library
const chai = require("chai");
// Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

describe("Server!", () => {
  it("Returns the default welcome message", (done) => {
    chai
      .request(server)
      .get("/")
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals("success");
        assert.strictEqual(res.body.message, "Welcome!");
        done();
      });
    });
      // unit test for the email/username entry to confirm a string variable
      it('It should be a non-empty string type variable', (done) => {
          chai
          .request(server)
          .get('/pages/login')
          .end((err, res) => {
            expect(res.body.inputEmail).to.be.an('string');
            done();
          });
    });
    it('Password Requirements, to be a string, to be longer than 8, and to not be the same as username', (done) => {
        chai
        .request(server)
        .get('/pages/login')
        .end((err, res) => {
          expect(res.body.inputPassword).to.be.an('string');
          expect(res.body.inputPassword).to.be.length.above(8);
          expect(res.body.inputPassword).to.be.not.equal(res.body.inputEmail);
          done();
        });
  });

  it('Name is a string', (done) => {
    chai
    .request(server)
    .get('/pages/register')
    .end((err, res) => {
      expect(res.body.fullName).to.be.an('string');
      done();
    });
});
it('email is a string', (done) => {
    chai
    .request(server)
    .get('/pages/register')
    .end((err, res) => {
      expect(res.body.emailAddress).to.be.an('string');
      done();
    });
});
it('password is a string', (done) => {
    chai
    .request(server)
    .get('/pages/register')
    .end((err, res) => {
      expect(res.body.passwordFirst).to.be.an('string');
      done();
    });
});    

});
