https://learn.javascript.ru/formdata#metody-obekta-formdata

```
formData.append(name, value) – добавляет к объекту поле с именем name и значением value,
formData.append(name, blob, fileName) – добавляет поле, как будто в форме имеется элемент <input type="file">, 
третий аргумент fileName устанавливает имя файла (не имя поля формы), как будто это имя из файловой системы пользователя,
formData.delete(name) – удаляет поле с заданным именем name
formData.get(name) – получает значение поля с именем name,
formData.has(name) – если существует поле с именем name, то возвращает true, иначе false
```
```
Ещё существует метод set, его синтаксис такой же, как у append. Разница в том, 
что .set удаляет все уже имеющиеся поля с именем name и только затем добавляет новое. То есть этот метод гарантирует, 
что будет существовать только одно поле с именем name, в остальном он аналогичен .append:

formData.set(name, value),
formData.set(name, blob, fileName).
```